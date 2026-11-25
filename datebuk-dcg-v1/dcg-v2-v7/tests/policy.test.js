import test from 'node:test';import assert from 'node:assert/strict';import {canManage,canRead,nextState,hash} from '../src/policy.js';import {encrypt,decrypt} from '../src/security.js';
test('admin step up',()=>{assert.equal(canManage({role:'admin',stepUp:true}),true);assert.equal(canManage({role:'staff',stepUp:true}),false);assert.equal(canManage({role:'admin'}),false)});
test('staff read only',()=>{assert.equal(canRead({role:'staff'}),true);assert.equal(canRead({role:'customer'}),false)});
test('late callback cannot regress',()=>{assert.equal(nextState('delivered','sent'),'delivered');assert.equal(nextState('dispatching','delivered'),'delivered');assert.equal(nextState('sent','bogus'),'sent')});
test('hash differs',()=>assert.notEqual(hash(['a']),hash(['b'])));
test('vault round trip and tamper',()=>{process.env.DCG_ENCRYPTION_KEY_HEX='ab'.repeat(32);const c=encrypt('secret');assert.equal(decrypt(c),'secret');const b=Buffer.from(c,'base64');b[15]^=1;assert.throws(()=>decrypt(b.toString('base64')))});
