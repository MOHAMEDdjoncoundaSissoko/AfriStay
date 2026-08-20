import { PaymentStrategy, PaymentResult, PaymentVerifyResult } from '../payment.interface';

export class CinetPayStrategy implements PaymentStrategy {
  private apiKey: string;
  private siteId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CINETPAY_API_KEY || '';
    this.siteId = process.env.CINETPAY_SITE_ID || '';
    this.baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.com/v2';
  }

  async initiate(data: {
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
  }): Promise<PaymentResult> {
    const response = await fetch(`${this.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': this.apiKey,
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        transaction_id: data.transactionId,
        description: data.description,
        return_url: data.return_url,
        notify_url: data.notify_url,
        customer_id: data.transactionId,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone_number: data.customerPhone,
        customer_city: '',
        customer_country: data.customerCountry,
        customer_state: '',
        customer_zip_code: '',
        lang: 'fr',
      }),
    });

    const result = await response.json();

    if (result.code !== '201') {
      throw new Error(result.message || 'Erreur CinetPay');
    }

    return {
      paymentUrl: result.data.payment_url,
      transactionId: result.data.transaction_id,
      paymentToken: result.data.payment_token,
    };
  }

  async verify(transactionId: string): Promise<PaymentVerifyResult> {
    const response = await fetch(
      `${this.baseUrl}/payment/check?transaction_id=${transactionId}&apikey=${this.apiKey}&site_id=${this.siteId}`,
    );

    const result = await response.json();

    const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
      ACCEPTED: 'SUCCESS',
      PENDING: 'PENDING',
      REFUSED: 'FAILED',
      CANCELLED: 'FAILED',
    };

    return {
      status: statusMap[result.data?.status] || 'FAILED',
      method: result.data?.cpm_pay_method,
      externalId: result.data?.cpm_trans_reference,
    };
  }
}