import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { InvalidSignatureError, assertValid, verify } from '../src/index.js';

const SECRET = 'webhook-secret';

function sign(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
}

test('verify accepts a valid signature', () => {
    const body = '{"event":"payment.paid","amount":50000}';
    assert.equal(verify(body, `sha256=${sign(body, SECRET)}`, SECRET), true);
});

test('verify rejects a tampered body', () => {
    const body = '{"event":"payment.paid","amount":50000}';
    assert.equal(verify(`${body} `, `sha256=${sign(body, SECRET)}`, SECRET), false);
});

test('verify rejects a signature made with the wrong secret', () => {
    const body = '{"event":"payment.paid","amount":50000}';
    assert.equal(verify(body, `sha256=${sign(body, 'other-secret')}`, SECRET), false);
});

test('verify accepts a signature without the sha256= prefix', () => {
    const body = '{"event":"payment.paid","amount":50000}';
    assert.equal(verify(body, sign(body, SECRET), SECRET), true);
});

test('verify returns false for an empty signature', () => {
    assert.equal(verify('{"a":1}', '', SECRET), false);
});

test('assertValid throws on a bad signature', () => {
    assert.throws(() => assertValid('{"a":1}', 'sha256=invalid', SECRET), InvalidSignatureError);
});