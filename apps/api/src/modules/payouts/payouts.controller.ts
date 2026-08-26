import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreatePayoutMethodDto } from './dto/create-payout-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HostGuard } from '../../common/guards/host.guard';

@ApiTags('Paiements Hôte')
@ApiBearerAuth()
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('methods')
  @UseGuards(JwtAuthGuard, HostGuard)
  @ApiOperation({ summary: 'Ajouter un moyen de paiement' })
  addMethod(@Request() req: any, @Body() dto: CreatePayoutMethodDto) {
    return this.payoutsService.addMethod(req.user.id, dto);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard, HostGuard)
  @ApiOperation({ summary: 'Voir mes moyens de paiement' })
  getMethods(@Request() req: any) {
    return this.payoutsService.getMethods(req.user.id);
  }

  @Patch('methods/:id/default')
  @UseGuards(JwtAuthGuard, HostGuard)
  @ApiOperation({ summary: 'Définir comme moyen par défaut' })
  setDefault(@Request() req: any, @Param('id') id: string) {
    return this.payoutsService.setDefault(req.user.id, id);
  }

  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard, HostGuard)
  @ApiOperation({ summary: 'Supprimer un moyen de paiement' })
  deleteMethod(@Request() req: any, @Param('id') id: string) {
    return this.payoutsService.deleteMethod(req.user.id, id);
  }
}