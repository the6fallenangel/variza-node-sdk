import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Expiry, VARIZA_CARDS, toRequestBody } from '../src/index.js';

test('toRequestBody includes required fields', () => {
    assert.deepEqual(toRequestBody({ amount: 50000, returnUrl: 'https://shop.example/return' }), {
        amount: 50000,
        return_url: 'https://shop.example/return',
    });
});

test('toRequestBody includes optional fields when set', () => {
    assert.deepEqual(
        toRequestBody({
            amount: 50000,
            returnUrl: 'https://shop.example/return',
            title: 'Order #123',
            cardLast4: '1234',
            expiresIn: Expiry.OneHour,
        }),
        {
            amount: 50000,
            title: 'Order #123',
            return_url: 'https://shop.example/return',
            card_last_4: '1234',
            expires_in: '1h',
        },
    );
});

test('toRequestBody supports variza cards settlement', () => {
    assert.equal(VARIZA_CARDS, 'variza');
    assert.deepEqual(
        toRequestBody({ amount: 50000, returnUrl: 'https://shop.example/return', cardLast4: VARIZA_CARDS }),
        { amount: 50000, return_url: 'https://shop.example/return', card_last_4: 'variza' },
    );
});

test('toRequestBody omits unset optional fields', () => {
    const body = toRequestBody({ amount: 10000, returnUrl: 'https://shop.example/return' });
    assert.ok(!('title' in body));
    assert.ok(!('card_last_4' in body));
    assert.ok(!('expires_in' in body));
});