import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { HostGuard } from '../../common/guards/host.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // Admin : vue d'ensemble
  @Get('overview')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOverview() {
    return this.analyticsService.getOverview();
  }

  // Admin : revenus par jour
  @Get('revenue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getRevenue(@Query('days') days?: string) {
    return this.analyticsService.getRevenueByDay(days ? parseInt(days) : 30);
  }

  // Admin : top logements
  @Get('top-properties')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getTopProperties(@Query('limit') limit?: string) {
    return this.analyticsService.getTopProperties(limit ? parseInt(limit) : 5);
  }

  // Admin : top villes
  @Get('top-cities')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getTopCities(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCities(limit ? parseInt(limit) : 5);
  }

  // Admin : répartition statuts réservations
  @Get('booking-statuses')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getBookingStatuses() {
    return this.analyticsService.getBookingStatusBreakdown();
  }

  // Admin : nouveaux utilisateurs par jour
  @Get('new-users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getNewUsers(@Query('days') days?: string) {
    return this.analyticsService.getNewUsersByDay(days ? parseInt(days) : 30);
  }

  // Hôte : taux d'occupation de son logement
  @Get('occupancy')
  @UseGuards(JwtAuthGuard, HostGuard)
  getOccupancy(
    @Query('propertyId') propertyId: string,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getPropertyOccupancy(
      propertyId,
      months ? parseInt(months) : 6,
    );
  }
}