import test from 'node:test';import assert from 'node:assert/strict';import {encrypt,decrypt} from '../src/security.js';
test('AES-256-GCM encrypt/decrypt',()=>{process.env.DCG_ENCRYPTION_KEY_HEX='ab'.repeat(32);const secret='test-secret';const encrypted=encrypt(secret);assert.notEqual(encrypted,secret);assert.equal(decrypt(encrypted),secret);});
test('tampered ciphertext rejected',()=>{process.env.DCG_ENCRYPTION_KEY_HEX='ab'.repeat(32);const b=Buffer.from(encrypt('secret'),'base64');b[b.length-1]^=1;assert.throws(()=>decrypt(b.toString('base64')));});
