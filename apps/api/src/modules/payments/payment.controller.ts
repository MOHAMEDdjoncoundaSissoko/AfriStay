import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  async initiate(@Req() req: Request, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate((req.user as any).sub, dto.bookingId);
  }

  @Post('webhook/cinetpay')
  async cinetpayWebhook(@Body() body: any) {
    return this.paymentService.handleCinetPayWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':bookingId/status')
  async getStatus(@Param('bookingId') bookingId: string) {
    return this.paymentService.getStatus(bookingId);
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Body() body: any) {
    return this.paymentService.handlePaystackWebhook(body);
  }
}