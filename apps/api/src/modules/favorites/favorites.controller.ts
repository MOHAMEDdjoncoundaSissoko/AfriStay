import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async list(@Request() req: any) {
    return this.favoritesService.list(req.user.id);
  }

  @Get('check/:propertyId')
  async check(@Param('propertyId') propertyId: string, @Request() req: any) {
    const isFav = await this.favoritesService.check(req.user.id, propertyId);
    return { favorited: isFav };
  }

  @Get('check-many')
  async checkMany(@Query('ids') ids: string, @Request() req: any) {
    const propertyIds = ids.split(',').filter(Boolean);
    return this.favoritesService.checkMany(req.user.id, propertyIds);
  }

  @Post(':propertyId')
  async toggle(@Param('propertyId') propertyId: string, @Request() req: any) {
    return this.favoritesService.toggle(req.user.id, propertyId);
  }
}