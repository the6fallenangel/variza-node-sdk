export const PAYMENT_EVENT_PAID = 'payment.paid';

export const PAYMENT_STATUS_PAID = 'paid';

/**
 * A parsed `payment.paid` webhook payload.
 */
export class VarizaPaymentEvent {
    readonly event: string;
    readonly slug: string;
    readonly attemptCode: string;
    readonly amount: number;
    readonly status: string;
    readonly sentAt: string;

    private constructor(data: {
        event: string;
        slug: string;
        attemptCode: string;
        amount: number;
        status: string;
        sentAt: string;
    }) {
        this.event = data.event;
        this.slug = data.slug;
        this.attemptCode = data.attemptCode;
        this.amount = data.amount;
        this.status = data.status;
        this.sentAt = data.sentAt;
    }

    static fromJson(json: string): VarizaPaymentEvent {
        const data = JSON.parse(json) as Record<string, unknown>;

        return new VarizaPaymentEvent({
            event: String(data.event ?? ''),
            slug: String(data.slug ?? ''),
            attemptCode: String(data.attempt_code ?? ''),
            amount: Number(data.amount ?? 0),
            status: String(data.status ?? ''),
            sentAt: String(data.sent_at ?? ''),
        });
    }

    isPaymentPaid(): boolean {
        return this.event === PAYMENT_EVENT_PAID;
    }

    isPaid(): boolean {
        return this.status === PAYMENT_STATUS_PAID;
    }
}