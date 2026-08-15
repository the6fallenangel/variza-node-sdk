export interface PayLink {
    slug: string;
    /** The URL to redirect the customer to. */
    payUrl: string;
    amount: number;
    title: string | null;
    quantity: number;
    returnUrl: string | null;
    expiresAt: string | null;
}

/**
 * Maps a raw API response body into a {@link PayLink}, tolerating missing
 * nullable fields.
 */
export function payLinkFromResponse(data: Record<string, unknown>): PayLink {
    return {
        slug: String(data.slug ?? ''),
        payUrl: String(data.pay_url ?? ''),
        amount: Number(data.amount ?? 0),
        title: nullableString(data.title),
        quantity: Number(data.quantity ?? 0),
        returnUrl: nullableString(data.return_url),
        expiresAt: nullableString(data.expires_at),
    };
}

function nullableString(value: unknown): string | null {
    return value !== null && value !== undefined ? String(value) : null;
}