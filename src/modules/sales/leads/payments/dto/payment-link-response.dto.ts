export class PaymentLinkResponseDto {
  success: boolean;
  message: string;
  data?: {
    clientId: number;
    transactionId: number;
    invoiceId: number;
    paymentLink?: string;
    leadStatus: string;
  };
  error?: string;
}
