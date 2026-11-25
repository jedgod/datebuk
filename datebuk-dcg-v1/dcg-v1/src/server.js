import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pg from 'pg';
import Redis from 'ioredis';
import {Queue,Worker} from 'bullmq';
import twilio from 'twilio';
import {z} from 'zod';
import {encrypt,decrypt,requireRole} from './security.js';

const app=express();app.use(helmet());
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
const redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:null});
const queue=new Queue('dcg-outbound',{connection:redis});
const phone=z.string().regex(/^\+[1-9]\d{1,14}$/);
const uuid=z.string().uuid();
const accountSchema=z.object({name:z.string().min(1).max(80),accountSid:z.string().regex(/^AC[0-9a-fA-F]{32}$/),authToken:z.string().min(10).optional(),apiKeySid:z.string().regex(/^SK[0-9a-fA-F]{32}$/).optional(),apiKeySecret:z.string().min(10).optional()}).refine(x=>!!x.authToken || (!!x.apiKeySid&&!!x.apiKeySecret));
const senderSchema=z.object({accountId:uuid,senderNumber:phone.optional(),messagingServiceSid:z.string().regex(/^MG[0-9a-fA-F]{32}$/).optional()}).refine(x=>!!x.senderNumber!==!!x.messagingServiceSid);
const messageSchema=z.object({senderId:uuid,to:phone,body:z.string().min(1).max(1600),purpose:z.enum(['transactional','verification','marketing']),idempotencyKey:z.string().min(8).max(128)});
function validate(schema){return (req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)return res.status(400).json({error:'invalid_input',details:result.error.flatten()});req.validated=result.data;next();};}
async function audit(tenant,actor,action,subject,metadata={}){await db.query('INSERT INTO dcg_audit(tenant_id,actor_id,action,subject_id,metadata) VALUES($1,$2,$3,$4,$5)',[tenant,actor,action,subject,metadata]);}
// INTEGRATION CONTRACT: Replace with DateBuk's existing verified session/JWT middleware.
// Never infer tenant/role from unverified HTTP headers. Default-deny until integrated.
function authenticate(req,res,next){return res.status(503).json({error:'DATEBUK_AUTH_ADAPTER_NOT_CONFIGURED'});}
app.post('/v1/admin/accounts',express.json(),authenticate,requireRole('admin'),validate(accountSchema),async(req,res,next)=>{try{const x=req.validated;const r=await db.query('INSERT INTO dcg_provider_accounts(tenant_id,name,account_sid,encrypted_auth_token,api_key_sid,encrypted_api_key_secret) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,account_sid,enabled',[req.identity.tenantId,x.name,x.accountSid,x.authToken?encrypt(x.authToken):null,x.apiKeySid||null,x.apiKeySecret?encrypt(x.apiKeySecret):null]);await audit(req.identity.tenantId,req.identity.userId,'provider.created',r.rows[0].id);res.status(201).json(r.rows[0]);}catch(e){next(e);}});
app.post('/v1/admin/senders',express.json(),authenticate,requireRole('admin'),validate(senderSchema),async(req,res,next)=>{try{const x=req.validated;const r=await db.query(`INSERT INTO dcg_senders(tenant_id,provider_account_id,sender_number,messaging_service_sid) SELECT $1,id,$3,$4 FROM dcg_provider_accounts WHERE id=$2 AND tenant_id=$1 RETURNING id,sender_number,messaging_service_sid,enabled`,[req.identity.tenantId,x.accountId,x.senderNumber||null,x.messagingServiceSid||null]);if(!r.rowCount)return res.status(404).json({error:'account_not_found'});await audit(req.identity.tenantId,req.identity.userId,'sender.created',r.rows[0].id);res.status(201).json(r.rows[0]);}catch(e){next(e);}});
app.post('/v1/messages',express.json(),authenticate,requireRole('admin','staff','customer'),validate(messageSchema),async(req,res,next)=>{try{const x=req.validated,t=req.identity.tenantId; // Hook: enforce DateBuk subscription entitlement, verified recipient consent, purpose authorization, spend caps and rate limits BEFORE insertion.
return res.status(503).json({error:'ENTITLEMENT_AND_CONSENT_ADAPTER_REQUIRED'});
}catch(e){next(e);}});
// This function is for integration after entitlement/consent adapters are implemented.
export async function enqueueApprovedMessage({tenantId,senderId,to,body,purpose,idempotencyKey}){
const r=await db.query(`INSERT INTO dcg_messages(tenant_id,sender_id,recipient,body,purpose,idempotency_key) SELECT $1,id,$3,$4,$5,$6 FROM dcg_senders WHERE id=$2 AND tenant_id=$1 AND enabled=true ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING id,state`,[tenantId,senderId,to,body,purpose,idempotencyKey]);if(!r.rowCount)throw Error('SENDER_NOT_ENABLED');await queue.add('send',{messageId:r.rows[0].id},{jobId:r.rows[0].id,attempts:4,backoff:{type:'exponential',delay:2000},removeOnComplete:1000});return r.rows[0];}
const worker=new Worker('dcg-outbound',async job=>{const {rows}=await db.query(`SELECT m.*,s.sender_number,s.messaging_service_sid,a.account_sid,a.encrypted_auth_token,a.api_key_sid,a.encrypted_api_key_secret FROM dcg_messages m JOIN dcg_senders s ON s.id=m.sender_id JOIN dcg_provider_accounts a ON a.id=s.provider_account_id WHERE m.id=$1 AND s.enabled AND a.enabled`,[job.data.messageId]);const m=rows[0];if(!m)return; if(m.provider_sid)return;const consent=await db.query(`SELECT status FROM dcg_consents WHERE tenant_id=$1 AND phone=$2 AND purpose=$3`,[m.tenant_id,m.recipient,m.purpose]);if(consent.rows[0]?.status!=='opted_in')throw Error('CONSENT_NOT_ACTIVE');const client=m.api_key_sid?twilio(m.api_key_sid,decrypt(m.encrypted_api_key_secret),{accountSid:m.account_sid}):twilio(m.account_sid,decrypt(m.encrypted_auth_token));const opts={to:m.recipient,body:m.body,statusCallback:`${process.env.PUBLIC_BASE_URL}/webhooks/twilio/status`};if(m.messaging_service_sid)opts.messagingServiceSid=m.messaging_service_sid;else opts.from=m.sender_number;const result=await client.messages.create(opts);await db.query('UPDATE dcg_messages SET provider_sid=$2,state=$3,updated_at=now() WHERE id=$1',[m.id,result.sid,result.status||'accepted']);},{connection:new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:null}),concurrency:3});
worker.on('failed',(job,err)=>console.error('message_worker_failed',job?.id,err.message));
// Public Twilio webhooks must validate signatures using the correct provider Auth Token.
// A credential resolver is mandatory for multi-account installations. Until configured, reject callbacks.
app.post('/webhooks/twilio/status',express.urlencoded({extended:false}),(_req,res)=>res.status(503).send('WEBHOOK_SIGNATURE_VALIDATOR_REQUIRED'));
app.post('/webhooks/twilio/inbound',express.urlencoded({extended:false}),(_req,res)=>res.status(503).send('WEBHOOK_SIGNATURE_VALIDATOR_REQUIRED'));
app.get('/health/live',(_req,res)=>res.json({status:'alive'}));
app.use((err,req,res,next)=>{console.error('dcg_error',err.code||err.message);res.status(500).json({error:'internal_error'});});
if(process.env.NODE_ENV!=='test')app.listen(Number(process.env.PORT||8088),()=>console.log('DCG listening'));
export {app};
