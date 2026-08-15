/**
 * Payment link validity periods, as accepted by the Variza API.
 */
export const Expiry = {
    ThirtyMinutes: '30m',
    OneHour: '1h',
    TwoHours: '2h',
    SixHours: '6h',
    OneDay: '1d',
    ThreeDays: '3d',
    OneWeek: '1w',
    Never: 'never',
} as const;

export type ExpiryValue = (typeof Expiry)[keyof typeof Expiry];