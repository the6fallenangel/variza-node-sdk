import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { ValidationError, VarizaClient } from '../src/index.js';

async function withServer(handler: (url: URL, headers: Record<string, string>, body: string, respond: (status: number, body: unknown) => void) => void, fn: (baseUrl: string) => Promise<void>): Promise<void> {
    const server = createServer((req, res) => {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            const respond = (status: number, body: unknown): void => {
                res.writeHead(status, { 'Content-Type': 'application/json' });
                res.end(typeof body === 'string' ? body : JSON.stringify(body));
            };
            handler(new URL(req.url ?? '/', 'http://localhost'), req.headers as Record<string, string>, data, respond);
        });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    try {
        await fn(`http://127.0.0.1:${port}`);
    } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
}

test('the transport talks to the API end to end and parses a PayLink', async () => {
    await withServer(
        (url, headers, body, respond) => {
            assert.equal(url.pathname, '/api/v1/pay');
            assert.equal(headers.authorization, 'Bearer token-1');
            assert.deepEqual(JSON.parse(body), { amount: 50000, return_url: 'https://shop.example/return' });

            respond(201, {
                slug: 'abc123',
                pay_url: 'https://variza.ir/pay/abc123',
                amount: 50000,
                title: 'Order #123',
                quantity: 1,
                return_url: 'https://shop.example/return',
                expires_at: '2026-08-14T12:00:00+03:30',
            });
        },
        async (baseUrl) => {
            const client = new VarizaClient({ token: 'token-1', baseUrl: `${baseUrl}/api/v1` });
            const link = await client.pay({ amount: 50000, returnUrl: 'https://shop.example/return' });

            assert.equal(link.slug, 'abc123');
            assert.equal(link.payUrl, 'https://variza.ir/pay/abc123');
        },
    );
});

test('the transport surfaces API validation errors', async () => {
    await withServer(
        (_url, _headers, _body, respond) => {
            respond(422, { message: 'مبلغ الزامی است.', errors: { amount: ['مبلغ الزامی است.'] } });
        },
        async (baseUrl) => {
            const client = new VarizaClient({ token: 'token-1', baseUrl });

            await assert.rejects(
                () => client.pay({ amount: 100, returnUrl: 'https://shop.example/return' }),
                (error: unknown) => {
                    assert.ok(error instanceof ValidationError);
                    assert.equal(error.status, 422);
                    return true;
                },
            );
        },
    );
});