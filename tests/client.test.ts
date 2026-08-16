import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, RateLimitError, ValidationError, VarizaClient } from '../src/index.js';
import type { Transport, TransportRequest, TransportResponse } from '../src/index.js';

class StubTransport implements Transport {
    lastMethod?: string;
    lastUrl?: string;
    lastHeaders: Record<string, string> = {};
    lastBody?: string;

    private readonly status: number;
    private readonly body: string;

    constructor(status: number, body: string) {
        this.status = status;
        this.body = body;
    }

    async request(request: TransportRequest): Promise<TransportResponse> {
        this.lastMethod = request.method;
        this.lastUrl = request.url;
        this.lastHeaders = request.headers;
        this.lastBody = request.body;

        return { status: this.status, headers: {}, body: this.body };
    }
}

test('pay returns a PayLink on 201', async () => {
    const transport = new StubTransport(
        201,
        JSON.stringify({
            slug: 'abc123',
            pay_url: 'https://variza.ir/pay/abc123',
            amount: 50000,
            title: 'Order #123',
            quantity: 1,
            return_url: 'https://shop.example/return',
            expires_at: '2026-08-14T12:00:00+03:30',
        }),
    );

    const client = new VarizaClient({ token: 'token-1', transport });
    const link = await client.pay({ amount: 50000, returnUrl: 'https://shop.example/return' });

    assert.equal(link.slug, 'abc123');
    assert.equal(transport.lastMethod, 'POST');
    assert.equal(transport.lastUrl, 'https://variza.ir/api/v1/pay');
    assert.equal(transport.lastHeaders.Authorization, 'Bearer token-1');
});

test('pay sends the request body', async () => {
    const transport = new StubTransport(
        201,
        JSON.stringify({ slug: 's', pay_url: 'https://variza.ir/pay/s', amount: 10000, quantity: 1 }),
    );

    const client = new VarizaClient({ token: 'token-1', transport });
    await client.pay({ amount: 10000, returnUrl: 'https://shop.example/return', title: 'T' });

    assert.deepEqual(JSON.parse(transport.lastBody ?? ''), {
        amount: 10000,
        title: 'T',
        return_url: 'https://shop.example/return',
    });
});

test('pay throws a ValidationError on 422', async () => {
    const transport = new StubTransport(
        422,
        JSON.stringify({
            message: 'مبلغ الزامی است.',
            errors: { amount: ['مبلغ الزامی است.'] },
        }),
    );

    const client = new VarizaClient({ token: 'token-1', transport });

    await assert.rejects(
        () => client.pay({ amount: 100, returnUrl: 'https://shop.example/return' }),
        (error: unknown) => {
            assert.ok(error instanceof ValidationError);
            assert.equal(error.status, 422);
            assert.equal(error.message, 'مبلغ الزامی است.');
            assert.deepEqual(error.errors, { amount: ['مبلغ الزامی است.'] });
            return true;
        },
    );
});

test('pay throws a RateLimitError on 429', async () => {
    const transport = new StubTransport(429, JSON.stringify({ message: 'Too many requests.' }));

    const client = new VarizaClient({ token: 'token-1', transport });

    await assert.rejects(
        () => client.pay({ amount: 50000, returnUrl: 'https://shop.example/return' }),
        (error: unknown) => {
            assert.ok(error instanceof RateLimitError);
            assert.equal(error.status, 429);
            return true;
        },
    );
});

test('pay throws a generic ApiError on 500', async () => {
    const transport = new StubTransport(500, 'Internal Server Error');

    const client = new VarizaClient({ token: 'token-1', transport });

    await assert.rejects(
        () => client.pay({ amount: 50000, returnUrl: 'https://shop.example/return' }),
        (error: unknown) => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.status, 500);
            return true;
        },
    );
});

test('pay wraps transport failures in an ApiError with status 0', async () => {
    const failingTransport: Transport = {
        async request(): Promise<TransportResponse> {
            throw new Error('ECONNREFUSED');
        },
    };

    const client = new VarizaClient({ token: 'token-1', transport: failingTransport });

    await assert.rejects(
        () => client.pay({ amount: 50000, returnUrl: 'https://shop.example/return' }),
        (error: unknown) => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.status, 0);
            assert.match(error.message, /ECONNREFUSED/);
            return true;
        },
    );
});