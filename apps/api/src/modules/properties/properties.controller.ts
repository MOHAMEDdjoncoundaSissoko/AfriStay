import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { MapQueryDto } from './dto/map-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Logements')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les logements publiés avec filtres' })
  findAll(@Query() query: PropertyQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes logements (hôte)' })
  findMine(@Request() req: any) {
    return this.propertiesService.findMine(req.user.id);
  }

  @Get('map')
  @ApiOperation({ summary: 'Données légères pour la carte (id, prix, coordonnées)' })
  findForMap(@Query() query: MapQueryDto) {
    return this.propertiesService.findForMap(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un logement' })
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.propertiesService.update(req.user.id, id, body);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Disponibilités d\'un logement (calendrier)' })
  async getAvailability(
    @Param('id') id: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    return this.propertiesService.getAvailability(id, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un logement' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un logement' })
  create(@Request() req: any, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un logement' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.propertiesService.delete(req.user.id, id);
  }
}