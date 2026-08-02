import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
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

  @Get('users/:id/public')
  async getPublicProfile(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        properties: {
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } },
          take: 6,
        },
        _count: { select: { properties: true } },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }
}