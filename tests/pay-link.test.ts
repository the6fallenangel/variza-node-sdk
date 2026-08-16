import assert from 'node:assert/strict';
import { test } from 'node:test';
import { payLinkFromResponse } from '../src/index.js';

test('payLinkFromResponse maps response fields', () => {
    const link = payLinkFromResponse({
        slug: 'abc123',
        pay_url: 'https://variza.ir/pay/abc123',
        amount: 50000,
        title: 'Order #123',
        quantity: 1,
        return_url: 'https://shop.example/return',
        expires_at: '2026-08-14T12:00:00+03:30',
    });

    assert.equal(link.slug, 'abc123');
    assert.equal(link.payUrl, 'https://variza.ir/pay/abc123');
    assert.equal(link.amount, 50000);
    assert.equal(link.title, 'Order #123');
    assert.equal(link.quantity, 1);
    assert.equal(link.returnUrl, 'https://shop.example/return');
    assert.equal(link.expiresAt, '2026-08-14T12:00:00+03:30');
});

test('payLinkFromResponse tolerates nullable fields', () => {
    const link = payLinkFromResponse({ slug: 'abc123', pay_url: 'https://variza.ir/pay/abc123', amount: 50000, quantity: 1 });

    assert.equal(link.title, null);
    assert.equal(link.returnUrl, null);
    assert.equal(link.expiresAt, null);
});