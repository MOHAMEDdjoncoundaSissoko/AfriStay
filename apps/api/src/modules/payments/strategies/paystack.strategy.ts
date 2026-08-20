import { PaymentStrategy, PaymentResult, PaymentVerifyResult } from '../payment.interface';

export class PaystackStrategy implements PaymentStrategy {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.baseUrl = 'https://api.paystack.com';
  }

  private toSmallestUnit(amount: number, currency: string): number {
    if (currency === 'XOF') return amount;
    return amount * 100;
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
    if (data.currency === 'XOF') {
      throw new Error('Paystack ne supporte pas le XOF. Utilisez CinetPay.');
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({
        email: data.customerEmail,
        amount: this.toSmallestUnit(data.amount, data.currency),
        reference: data.transactionId,
        callback_url: data.return_url,
        metadata: {
          bookingId: data.transactionId,
          description: data.description,
          customerName: data.customerName,
        },
      }),
    });

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message || 'Erreur Paystack');
    }

    return {
      paymentUrl: result.data.authorization_url,
      transactionId: result.data.reference,
    };
  }

  async verify(transactionId: string): Promise<PaymentVerifyResult> {
    const response = await fetch(`${this.baseUrl}/transaction/verify/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    const result = await response.json();

    const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
      success: 'SUCCESS',
      pending: 'PENDING',
      failed: 'FAILED',
      abandoned: 'FAILED',
    };

    const channelMap: Record<string, any> = {
      card: 'VISA',
      mobile_money: 'MTN_MOMO',
      bank: 'VISA',
    };

    return {
      status: statusMap[result.data?.status] || 'FAILED',
      method: channelMap[result.data?.channel] || 'VISA',
      externalId: result.data?.reference,
    };
  }
}