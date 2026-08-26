import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin - Versements')
@ApiBearerAuth()
@Controller('admin/payouts')
@UseGuards(AdminGuard)
export class AdminPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Versements en attente (avec coordonnées hôte)' })
  getPending() {
    return this.payoutsService.getPendingPayouts();
  }

  @Get()
  @ApiOperation({ summary: 'Tous les versements (avec filtre statut)' })
  getAll(@Query('status') status?: string) {
    return this.payoutsService.getAllPayouts(status);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Marquer un versement comme payé' })
  markAsPaid(@Param('id') id: string, @Request() req: any, @Body() dto: MarkPaidDto) {
    return this.payoutsService.markAsPaid(id, req.user.id, dto);
  }
}