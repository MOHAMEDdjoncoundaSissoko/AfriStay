import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Références')
@Controller('references')
export class ReferencesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAll() {
    const [countries, cities, propertyTypes] = await Promise.all([
      this.prisma.country.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.propertyType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);
    return { countries, cities, propertyTypes };
  }
}