import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { MapQueryDto } from './dto/map-query.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePropertyDto) {
    // Générer le slug à partir du titre
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Vérifier que la ville et le pays existent
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) throw new NotFoundException('Ville non trouvée');

    const property = await this.prisma.property.create({
      data: {
        hostId: userId,
        title: dto.title,
        slug,
        description: dto.description,
        propertyTypeId: dto.propertyTypeId,
        countryId: dto.countryId,
        cityId: dto.cityId,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        pricePerNight: dto.pricePerNight,
        pricePerWeek: dto.pricePerWeek,
        pricePerMonth: dto.pricePerMonth,
        bedrooms: dto.bedrooms,
        beds: dto.beds,
        bathrooms: dto.bathrooms,
        areaSqm: dto.areaSqm,
        maxGuests: dto.maxGuests,
        petsAllowed: dto.petsAllowed ?? false,
        smokingAllowed: dto.smokingAllowed ?? false,
        status: 'PUBLISHED',
        amenities: dto.amenitySlugs
          ? {
              create: dto.amenitySlugs.map((slug) => ({
                amenity: { connect: { slug } },
              })),
            }
          : undefined,
      },
      include: {
        propertyType: true,
        city: true,
        country: true,
        amenities: { include: { amenity: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        host: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return property;
  }

  async findAll(query: PropertyQueryDto) {
    const where = await this.buildWhere(query);
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          propertyType: true,
          city: true,
          country: true,
          amenities: { include: { amenity: true } },
          images: { where: { isCover: true }, take: 1 },
          host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      properties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        propertyType: true,
        city: true,
        country: true,
        amenities: { include: { amenity: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        host: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        reviews: {
          include: {
            reviewer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) throw new NotFoundException('Logement non trouvé');
    return property;
  }

  async findMine(userId: string) {
    return this.prisma.property.findMany({
      where: { hostId: userId },
      include: {
        propertyType: true,
        city: true,
        images: { where: { isCover: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Logement non trouvé');
    if (property.hostId !== userId) throw new ForbiddenException('Vous n\'êtes pas le propriétaire');

    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  async findForMap(query: MapQueryDto) {
    const where = await this.buildWhere(query);

    return this.prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        pricePerNight: true,
        latitude: true,
        longitude: true,
        city: { select: { name: true } },
        ratingAverage: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async buildWhere(query: any): Promise<any> {
    const where: any = { status: 'PUBLISHED' };

    if (query.city) {
      const city = await this.prisma.city.findFirst({
        where: { slug: query.city.toLowerCase() },
      });
      if (city) {
        where.cityId = city.id;
      }
    }

    if (query.country) {
      where.countryId = query.country;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice !== undefined && query.minPrice !== '') {
      where.pricePerNight = { ...(where.pricePerNight || {}), gte: Number(query.minPrice) };
    }
    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      where.pricePerNight = { ...(where.pricePerNight || {}), lte: Number(query.maxPrice) };
    }
    if (query.minBedrooms) {
      where.bedrooms = { gte: Number(query.minBedrooms) };
    }
    if (query.amenities?.length) {
      where.amenities = {
        some: { amenity: { slug: { in: query.amenities } } },
      };
    }

    return where;
  }

  async getAvailability(propertyId: string, start: Date, end: Date) {
    return this.prisma.propertyAvailability.findMany({
      where: { propertyId, date: { gte: start, lte: end } },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });
  }
}