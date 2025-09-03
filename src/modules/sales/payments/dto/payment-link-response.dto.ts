export class PaymentLinkResponseDto {
  success: boolean;
  message: string;
  data?: {
    clientId: number;
    transactionId: number;
    paymentLink?: string;
    leadStatus: string;
  };
  error?: string;
}
