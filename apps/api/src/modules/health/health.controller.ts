import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Santé')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Vérifier que l\'API et la base de données fonctionnent' })
  async check() {
    const userCount = await this.prisma.user.count();
    const propertyCount = await this.prisma.property.count();
    const cityCount = await this.prisma.city.count();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        properties: propertyCount,
        cities: cityCount,
      },
    };
  }
}