import crypto from 'node:crypto';
const key = () => {const b=Buffer.from(process.env.DCG_ENCRYPTION_KEY_HEX||'', 'hex'); if(b.length!==32) throw Error('DCG_ENCRYPTION_KEY_HEX must be 32 bytes'); return b;};
export function encrypt(value){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv('aes-256-gcm',key(),iv);const ct=Buffer.concat([c.update(value,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),ct]).toString('base64');}
export function decrypt(value){const b=Buffer.from(value,'base64');const d=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8');}
export function requireRole(...roles){return (req,res,next)=>{if(!req.identity || !roles.includes(req.identity.role))return res.status(403).json({error:'forbidden'});next();};}
