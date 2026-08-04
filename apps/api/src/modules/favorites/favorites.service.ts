import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            images: { where: { isCover: true }, take: 1 },
            city: { select: { name: true } },
            country: { select: { name: true } },
            propertyType: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => f.property);
  }

  async toggle(userId: string, propertyId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          userId_propertyId: { userId, propertyId },
        },
      });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: { userId, propertyId },
    });
    return { favorited: true };
  }

  async check(userId: string, propertyId: string): Promise<boolean> {
    const fav = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });
    return !!fav;
  }

  async checkMany(userId: string, propertyIds: string[]): Promise<Record<string, boolean>> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        propertyId: { in: propertyIds },
      },
      select: { propertyId: true },
    });
    const map: Record<string, boolean> = {};
    for (const id of propertyIds) map[id] = false;
    for (const fav of favorites) map[fav.propertyId] = true;
    return map;
  }
}