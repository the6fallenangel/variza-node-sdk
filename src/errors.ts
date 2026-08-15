/**
 * Base error for all Variza SDK errors.
 */
export class VarizaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export interface ApiErrorOptions {
    /** HTTP status code, or `0` when the request could not be completed. */
    status: number;
    /** API error details, when provided by the server. */
    errors?: Record<string, unknown>;
    /** The raw response body, when one was received. */
    responseBody?: string;
    /** A human-readable error message. */
    message?: string;
}

/**
 * Thrown for any non-successful API response (or a network failure).
 */
export class ApiError extends VarizaError {
    readonly status: number;
    readonly errors: Record<string, unknown>;
    readonly responseBody: string;

    constructor(options: ApiErrorOptions) {
        super(options.message ?? `Variza API request failed with status ${options.status}`);
        this.status = options.status;
        this.errors = options.errors ?? {};
        this.responseBody = options.responseBody ?? '';
    }
}

/**
 * Thrown when the API responds with a `422` validation error.
 */
export class ValidationError extends ApiError {}

/**
 * Thrown when the API responds with a `429` rate-limit error.
 */
export class RateLimitError extends ApiError {}

/**
 * Thrown when a webhook signature does not match the expected HMAC-SHA256 digest.
 */
export class InvalidSignatureError extends VarizaError {
    constructor(message = 'The webhook signature is invalid.') {
        super(message);
    }
}