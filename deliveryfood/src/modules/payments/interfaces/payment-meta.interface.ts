export interface PaymentProviderMeta {
    transactionId?: string;
    providerName?: string;
    providerResponse?: Record<string, unknown>;
    timestamp?: Date;
    paymentUrl?: string;
    qrCode?: string;
    bankCode?: string;
    [key: string]: unknown;
}
