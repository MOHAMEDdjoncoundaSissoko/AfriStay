import { Controller, Post, Get, Body, Param, Req, UseGuards, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { verifyCinetPaySignature, verifyPaystackSignature } from './utils/signature.util';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  async initiate(@Req() req: Request, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate((req.user as any).sub, dto.bookingId);
  }

  @Post('webhook/cinetpay')
  async cinetpayWebhook( @Req() req: Request, @Headers('x-token') signature: string,) {
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyCinetPaySignature(rawBody, signature, process.env.CINETPAY_SECRET_KEY!,);

    if (!isValid) {
      return { status: 'ok' };
    }
    return this.paymentService.handleCinetPayWebhook(req.body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':bookingId/status')
  async getStatus(@Param('bookingId') bookingId: string) {
    return this.paymentService.getStatus(bookingId);
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Req() req: Request, @Headers('x-paystack-signature') signature: string,) {
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyPaystackSignature( rawBody, signature, process.env.PAYSTACK_SECRET_KEY!,);

    if (!isValid) {
      return { status: 'ok' };
    }
    return this.paymentService.handlePaystackWebhook(req.body);
  }
}