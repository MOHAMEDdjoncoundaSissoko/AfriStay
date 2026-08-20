export interface PaymentResult {
  paymentUrl: string;
  transactionId: string;
  paymentToken?: string;
}

export interface PaymentVerifyResult {
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method?: string;
  externalId?: string;
}

export interface PaymentStrategy {
  initiate(data: {
    amount: number;
    currency: string;
    transactionId: string;
    description: string;
    return_url: string;
    notify_url: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCountry: string;
  }): Promise<PaymentResult>;

  verify(transactionId: string): Promise<PaymentVerifyResult>;
}