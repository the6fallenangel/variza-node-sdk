import { ApiError, RateLimitError, ValidationError } from './errors.js';
import { NodeTransport } from './http.js';
import type { Transport, TransportResponse } from './http.js';
import { payLinkFromResponse } from './pay-link.js';
import type { PayLink } from './pay-link.js';
import { toRequestBody } from './pay-request.js';
import type { PayRequest } from './pay-request.js';

export const BASE_URL = 'https://variza.ir/api/v1';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface VarizaClientOptions {
    /** Your Variza API token. */
    token: string;
    /** Override the API base URL (mainly useful in tests). */
    baseUrl?: string;
    /** A custom transport; defaults to the built-in zero-dependency one. */
    transport?: Transport;
    /** Request timeout in milliseconds. */
    timeoutMs?: number;
}

/**
 * Client for the Variza REST API.
 */
export class VarizaClient {
    readonly baseUrl: string;

    private token: string;
    private transport: Transport;
    private timeoutMs: number;

    constructor(options: VarizaClientOptions) {
        this.token = options.token;
        this.baseUrl = options.baseUrl ?? BASE_URL;
        this.transport = options.transport ?? new NodeTransport();
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    setToken(token: string): void {
        this.token = token;
    }

    /**
     * Creates a payment link and returns it, ready to redirect the customer to.
     *
     * @throws {ValidationError} when the request fails validation (422).
     * @throws {RateLimitError} when the rate limit is reached (429).
     * @throws {ApiError} for any other failure.
     */
    async pay(request: PayRequest): Promise<PayLink> {
        const response = await this.request('POST', '/pay', JSON.stringify(toRequestBody(request)));

        if (response.status === 201) {
            return payLinkFromResponse(this.decode(response.body));
        }

        throw this.exceptionFor(response);
    }

    private async request(method: string, path: string, body: string): Promise<TransportResponse> {
        try {
            return await this.transport.request({
                method,
                url: this.baseUrl + path,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body,
                timeoutMs: this.timeoutMs,
            });
        } catch (error) {
            throw new ApiError({
                status: 0,
                message: error instanceof Error ? error.message : 'Variza API request failed.',
            });
        }
    }

    private decode(body: string): Record<string, unknown> {
        const data: unknown = JSON.parse(body);

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            throw new ApiError({ status: 0, message: 'Invalid JSON response from Variza API.' });
        }

        return data as Record<string, unknown>;
    }

    private exceptionFor(response: TransportResponse): ApiError {
        let message = 'Variza API request failed.';
        let errors: Record<string, unknown> = {};

        try {
            const data: unknown = JSON.parse(response.body);
            if (typeof data === 'object' && data !== null) {
                const record = data as Record<string, unknown>;
                message = typeof record.message === 'string' ? record.message : message;
                if (typeof record.errors === 'object' && record.errors !== null) {
                    errors = record.errors as Record<string, unknown>;
                }
            }
        } catch {
            // Non-JSON response; fall back to the default message.
        }

        const status = response.status;

        if (status === 422) {
            return new ValidationError({
                status,
                errors,
                responseBody: response.body,
                message,
            });
        }

        if (status === 429) {
            return new RateLimitError({
                status,
                errors,
                responseBody: response.body,
                message,
            });
        }

        return new ApiError({
            status,
            errors,
            responseBody: response.body,
            message,
        });
    }
}