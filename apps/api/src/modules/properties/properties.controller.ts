import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
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