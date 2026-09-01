import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CinetPayStrategy } from './strategies/cinetpay.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { PaystackStrategy } from './strategies/paystack.strategy';
import { assertTransition, PaymentStatus } from './utils/payment-states.util';

@Injectable()
export class PaymentService {
  private cinetpay = new CinetPayStrategy();
  private paystack = new PaystackStrategy();

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private getStrategy(currency: string) {
    if (currency === 'XOF') return this.cinetpay;
    return this.paystack;
  }

  async initiate(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        traveler: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        property: { select: { id: true, title: true, country: { select: { code: true } } } },
      },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.travelerId !== userId) throw new BadRequestException('Non autorisé');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Réservation annulée');

    // Idempotence : si un paiement PENDING existe déjà pour cette réservation,
    // on le retourne au lieu d'en créer un nouveau
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: bookingId,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Retourner le paiement existant au lieu d'en créer un doublon
      return {
        paymentId: existingPayment.id,
        paymentUrl: existingPayment.externalId, // ou le champ où tu stockes l'URL
        status: existingPayment.status,
      };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
    });

    if (!payment) throw new NotFoundException('Paiement non trouvé');
    if (payment.status === 'SUCCESS') throw new BadRequestException('Paiement déjà effectué');

    const strategy = this.getStrategy(booking.currency);
    const isCinetpay = booking.currency === 'XOF';
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/${booking.id}/payment-result`;
    const notifyUrl = `${process.env.API_URL || 'http://localhost:4000'}/api/payments/webhook/${isCinetpay ? 'cinetpay' : 'paystack'}`;

    const result = await strategy.initiate({
      amount: booking.totalAmount,
      currency: booking.currency,
      transactionId: payment.id,
      description: `Réservation ${booking.bookingNumber} - ${booking.property.title}`,
      return_url: returnUrl,
      notify_url: notifyUrl,
      customerName: `${booking.traveler.firstName} ${booking.traveler.lastName}`,
      customerEmail: booking.traveler.email,
      customerPhone: booking.traveler.phone || '',
      customerCountry: booking.property.country?.code || 'CI',
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...((payment.metadata as any) || {}),
          cinetpay_payment_token: result.paymentToken,
          cinetpay_payment_url: result.paymentUrl,
        },
      },
    });

    return {
      paymentUrl: result.paymentUrl,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      amount: booking.totalAmount,
      currency: booking.currency,
    };
  }

  async handleCinetPayWebhook(body: any) {
    const { cpm_trans_id, cpm_trans_status, cpm_pay_method } = body;

    if (!cpm_trans_id) return { success: false, message: 'Transaction ID manquant' };

    const payment = await this.prisma.payment.findUnique({
      where: { id: cpm_trans_id },
      include: {
        booking: {
          include: {
            traveler: { select: { id: true, firstName: true, lastName: true } },
            property: { select: { id: true, title: true, hostId: true } },
          },
        },
      },
    });

    if (!payment) return { success: false, message: 'Paiement non trouvé' };

    // === DÉBUT VÉRIFICATION MONTANT ===
    const cinetpayAmount = Math.round(body.cpm_amount || 0);
    const expectedAmount = Math.round(payment.amount);
    if (cinetpayAmount !== expectedAmount) {
      console.error(
        `[SECURITE] Montant incohérent CinetPay: recu=${cinetpayAmount}, attendu=${expectedAmount}, payment=${payment.id}`,
      );
      return { success: true };
    }
    // === FIN VÉRIFICATION MONTANT ===

    const statusMap: Record<string, any> = {
      ACCEPTED: 'SUCCESS',
      PENDING: 'PENDING',
      REFUSED: 'FAILED',
      CANCELLED: 'FAILED',
    };

    const newStatus = statusMap[cpm_trans_status] || payment.status;

    const methodMap: Record<string, any> = {
      MOBILE_MONEY: 'WAVE',
      CARD: 'VISA',
      WALLET: 'WAVE',
    };

    assertTransition(payment.status, newStatus as PaymentStatus);
    const updateData: any = {
      status: newStatus as PaymentStatus,
      method: methodMap[cpm_pay_method] || payment.method,
      externalId: body.cpm_trans_reference || null,
    };

    if (newStatus === 'SUCCESS') {
      updateData.paidAt = new Date();
    } else if (newStatus === 'FAILED') {
      updateData.failedAt = new Date();
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    if (newStatus === 'SUCCESS' && payment.booking) {
      await this.notificationsService.create(
        payment.booking.property.hostId,
        'PAYMENT_RECEIVED',
        'Paiement reçu',
        `Paiement de ${payment.amount} ${payment.currency} reçu pour ${payment.booking.property.title}`,
        {
          bookingId: payment.booking.id,
          propertyId: payment.booking.property.id,
          amount: payment.amount,
        },
      );
    }

    return { success: true };
  }

  async getStatus(bookingId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        paidAt: true,
        failedAt: true,
        createdAt: true,
      },
    });

    if (!payment) throw new NotFoundException('Paiement non trouvé');
    return payment;
  }

  async handlePaystackWebhook(body: any) {
    const { reference, data } = body;

    if (!reference) return { success: false, message: 'Reference manquante' };

    const payment = await this.prisma.payment.findUnique({
        where: { id: reference },
        include: {
        booking: {
            include: {
            traveler: { select: { id: true, firstName: true, lastName: true } },
            property: { select: { id: true, title: true, hostId: true } },
            },
        },
        },
    });

    if (!payment) return { success: false, message: 'Paiement non trouvé' };

    // === DÉBUT VÉRIFICATION MONTANT ===
    const paystackAmountRaw = data?.amount || 0;
    // Paystack envoie en plus petite unité pour certaines devises (kobo, cents)
    // XOF n'a pas de sous-unité, mais on vérifie les deux cas
    let paystackAmount: number;
    if (data?.currency === 'XOF') {
      paystackAmount = paystackAmountRaw;
    } else {
      paystackAmount = paystackAmountRaw / 100;
    }
    const expectedAmount = Math.round(payment.amount);
    if (Math.round(paystackAmount) !== expectedAmount) {
      console.error(
        `[SECURITE] Montant incohérent Paystack: recu=${paystackAmount}, attendu=${expectedAmount}, payment=${payment.id}`,
      );
      return { success: true };
    }
    // === FIN VÉRIFICATION MONTANT ===

    const statusMap: Record<string, any> = {
        success: 'SUCCESS',
        pending: 'PENDING',
        failed: 'FAILED',
        abandoned: 'FAILED',
    };

    const newStatus = statusMap[data?.status] || payment.status;

    const channelMap: Record<string, any> = {
        card: 'VISA',
        mobile_money: 'MTN_MOMO',
        bank: 'VISA',
    };

    assertTransition(payment.status, newStatus as PaymentStatus);
    const updateData: any = {
        status: newStatus as PaymentStatus,
        method: channelMap[data?.channel] || payment.method,
        externalId: data?.reference || null,
    };

    if (newStatus === 'SUCCESS') {
        updateData.paidAt = new Date();
    } else if (newStatus === 'FAILED') {
        updateData.failedAt = new Date();
    }

    await this.prisma.payment.update({
        where: { id: payment.id },
        data: updateData,
    });

    if (newStatus === 'SUCCESS' && payment.booking) {
        await this.notificationsService.create(
        payment.booking.property.hostId,
        'PAYMENT_RECEIVED',
        'Paiement reçu',
        `Paiement de ${payment.amount} ${payment.currency} reçu pour ${payment.booking.property.title}`,
        {
            bookingId: payment.booking.id,
            propertyId: payment.booking.property.id,
            amount: payment.amount,
        },
        );
    }

    return { success: true };
  }
}