import type { ExpiryValue } from './expiry.js';

export const RANDOM_CARD = 'random' as const;
export const VARIZA_CARDS = 'variza' as const;

export interface PayRequest {
    /** The amount in Toman (minimum 1000). */
    amount: number;
    /** An HTTPS URL to return the customer to after payment. */
    returnUrl: string;
    /** An order title, shown on the payment page. */
    title?: string;
    /**
     * The last four digits of the destination card (e.g. "1234"),
     * {@link RANDOM_CARD} ("random") for automatic least-load selection
     * (requires RandomLeastLoad plan feature and at least 2 active cards),
     * or {@link VARIZA_CARDS} ("variza") to receive buyer payments on
     * Variza cards with Toman wallet settlement and USDT withdrawal
     * (requires CustodialSettlement plan feature, no seller bank account
     * needed, max 2,000,000 Toman per link).
     */
    cardLast4?: string;
    /** The payment link validity period. */
    expiresIn?: ExpiryValue;
    /** Team member phone (09xxxxxxxxx) — owner creates link on behalf of member for marketplace plans. */
    memberPhone?: string;
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

    if (request.memberPhone !== undefined) {
        body.member_phone = request.memberPhone;
    }

    return body;
}