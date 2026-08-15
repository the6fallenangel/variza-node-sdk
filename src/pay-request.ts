import type { ExpiryValue } from './expiry.js';

export interface PayRequest {
    /** The amount in Toman (minimum 1000). */
    amount: number;
    /** An HTTPS URL to return the customer to after payment. */
    returnUrl: string;
    /** An order title, shown on the payment page. */
    title?: string;
    /** The last four digits of the destination card to receive the transfer. */
    cardLast4?: string;
    /** The payment link validity period. */
    expiresIn?: ExpiryValue;
}

/**
 * Normalizes a {@link PayRequest} into the wire format expected by the Variza API,
 * omitting any unset optional fields.
 */
export function toRequestBody(request: PayRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
        amount: request.amount,
        return_url: request.returnUrl,
    };

    if (request.title !== undefined) {
        body.title = request.title;
    }

    if (request.cardLast4 !== undefined) {
        body.card_last_4 = request.cardLast4;
    }

    if (request.expiresIn !== undefined) {
        body.expires_in = request.expiresIn;
    }

    return body;
}