import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VarizaPaymentEvent } from '../src/index.js';

const PAYLOAD = '{"event":"payment.paid","slug":"abc123","attempt_code":"AT-1","amount":50000,"status":"paid","sent_at":"2026-08-14T12:00:00+03:30"}';

test('fromJson maps webhook payload', () => {
    const event = VarizaPaymentEvent.fromJson(PAYLOAD);

    assert.equal(event.event, 'payment.paid');
    assert.equal(event.slug, 'abc123');
    assert.equal(event.attemptCode, 'AT-1');
    assert.equal(event.amount, 50000);
    assert.equal(event.status, 'paid');
    assert.equal(event.sentAt, '2026-08-14T12:00:00+03:30');
});

test('isPaymentPaid reflects the event name', () => {
    assert.equal(VarizaPaymentEvent.fromJson(PAYLOAD).isPaymentPaid(), true);
    assert.equal(VarizaPaymentEvent.fromJson(PAYLOAD.replace('payment.paid', 'other')).isPaymentPaid(), false);
});

test('isPaid reflects the status', () => {
    assert.equal(VarizaPaymentEvent.fromJson(PAYLOAD).isPaid(), true);
    assert.equal(VarizaPaymentEvent.fromJson(PAYLOAD.replace('"paid"', '"pending"')).isPaid(), false);
});