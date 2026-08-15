import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidSignatureError } from './errors.js';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verifies the `X-Webhook-Signature` header against the raw webhook body
 * using HMAC-SHA256 and a timing-safe comparison.
 *
 * The signature may or may not carry the `sha256=` prefix.
 */
export function verify(
    rawBody: string | Buffer,
    signatureHeader: string,
    secret: string,
): boolean {
    const provided = signatureHeader.startsWith(SIGNATURE_PREFIX)
        ? signatureHeader.slice(SIGNATURE_PREFIX.length)
        : signatureHeader;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const providedBuffer = Buffer.from(provided, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
        return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Like {@link verify}, but throws an {@link InvalidSignatureError} when the
 * signature does not match.
 */
export function assertValid(rawBody: string | Buffer, signatureHeader: string, secret: string): void {
    if (!verify(rawBody, signatureHeader, secret)) {
        throw new InvalidSignatureError();
    }
}