import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesService } from '../src/modules/properties/properties.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockPrismaService = {
  property: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  city: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  propertyAmenity: {
    deleteMany: jest.fn(),
  },
  propertyImage: {
    deleteMany: jest.fn(),
  },
  propertyAvailability: {
    findMany: jest.fn(),
  },
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE
  // ========================

  describe('create', () => {
    const dto = {
      title: 'Villa Cocody',
      description: 'Belle villa',
      propertyTypeId: 'type-1',
      countryId: 'CI',
      cityId: 'city-abj',
      address: 'Cocody',
      latitude: 5.36,
      longitude: -3.93,
      pricePerNight: 85000,
      bedrooms: 4,
      beds: 6,
      bathrooms: 3,
      areaSqm: 350,
      maxGuests: 8,
      amenitySlugs: ['wifi', 'pool'],
      imageUrls: ['https://img.com/1.jpg', 'https://img.com/2.jpg'],
    };

    it('doit créer un logement avec slug généré, équipements et images', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue({ id: 'city-abj', name: 'Abidjan' });
      mockPrismaService.property.create.mockResolvedValue({
        id: 'prop-1',
        title: 'Villa Cocody',
        slug: 'villa-cocody',
        status: 'PUBLISHED',
      });

      const result = await service.create('user-1', dto);

      // Slug généré à partir du titre
      const createCall = mockPrismaService.property.create.mock.calls[0][0];
      expect(createCall.data.slug).toBe('villa-cocody');
      expect(createCall.data.hostId).toBe('user-1');
      expect(createCall.data.status).toBe('PUBLISHED');

      // Première image = couverture
      const imagesCreate = createCall.data.images.create;
      expect(imagesCreate[0].isCover).toBe(true);
      expect(imagesCreate[1].isCover).toBe(false);
      expect(imagesCreate[0].sortOrder).toBe(0);
      expect(imagesCreate[1].sortOrder).toBe(1);

      // Équipements liés par slug
      const amenitiesCreate = createCall.data.amenities.create;
      expect(amenitiesCreate).toHaveLength(2);
      expect(amenitiesCreate[0].amenity.connect.slug).toBe('wifi');
      expect(amenitiesCreate[1].amenity.connect.slug).toBe('pool');
    });

    it('doit rejeter si la ville n\'existe pas (404)', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.property.create).not.toHaveBeenCalled();
    });

    it('doit créer sans équipements ni images si non fournis', async () => {
      const minimalDto = { ...dto, amenitySlugs: undefined, imageUrls: undefined };
      mockPrismaService.city.findUnique.mockResolvedValue({ id: 'city-abj' });
      mockPrismaService.property.create.mockResolvedValue({ id: 'prop-2' });

      await service.create('user-1', minimalDto);

      const createCall = mockPrismaService.property.create.mock.calls[0][0];
      expect(createCall.data.amenities).toBeUndefined();
      expect(createCall.data.images).toBeUndefined();
    });
  });

  // ========================
  // FIND ALL
  // ========================

  describe('findAll', () => {
    it('doit retourner les logements avec pagination par défaut', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue(null);
      mockPrismaService.property.findMany.mockResolvedValue([{ id: 'prop-1' }]);
      mockPrismaService.property.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.properties).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      });
      // Vérifie que status: PUBLISHED est dans le where
      const findManyCall = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe('PUBLISHED');
    });

    it('doit filtrer par ville via slug', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue({ id: 'city-abj' });
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.findAll({ city: 'abidjan' });

      expect(mockPrismaService.city.findFirst).toHaveBeenCalledWith({
        where: { slug: 'abidjan' },
      });
      const findManyCall = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(findManyCall.where.cityId).toBe('city-abj');
    });

    it('doit filtrer par prix minimum et maximum', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue(null);
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.findAll({ minPrice: 10000, maxPrice: 100000 });

      const findManyCall = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(findManyCall.where.pricePerNight).toEqual({ gte: 10000, lte: 100000 });
    });

    it('doit filtrer par nombre minimum de chambres', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue(null);
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.findAll({ minBedrooms: 3 });

      const findManyCall = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(findManyCall.where.bedrooms).toEqual({ gte: 3 });
    });

    it('doit paginer correctement (page 2, limit 5)', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue(null);
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(23);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 23,
        totalPages: 5,
      });
      const findManyCall = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(5);
      expect(findManyCall.take).toBe(5);
    });
  });

  // ========================
  // FIND ONE
  // ========================

  describe('findOne', () => {
    it('doit retourner le logement avec ses relations', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        title: 'Villa Cocody',
        deletedAt: null,
      });

      const result = await service.findOne('prop-1');

      expect(result!.title).toBe('Villa Cocody');
      const call = mockPrismaService.property.findUnique.mock.calls[0][0];
      expect(call.include.reviews).toBeDefined();
      expect(call.include.amenities).toBeDefined();
      expect(call.include.images).toBeDefined();
    });

    it('doit rejeter un logement inexistant (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
    });

  });

  // ========================
  // FIND MINE
  // ========================

  describe('findMine', () => {
    it('doit retourner uniquement les logements de l\'hôte', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'prop-1', hostId: 'user-1' },
        { id: 'prop-2', hostId: 'user-1' },
      ]);

      const result = await service.findMine('user-1');

      expect(result).toHaveLength(2);
      const call = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(call.where.hostId).toBe('user-1');
    });
  });

  // ========================
  // UPDATE
  // ========================

  describe('update', () => {
    it('doit mettre à jour les champs fournis', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'user-1',
        title: 'Ancien titre',
      });
      mockPrismaService.property.update.mockResolvedValue({
        id: 'prop-1',
        title: 'Nouveau titre',
      });

      const result = await service.update('user-1', 'prop-1', {
        title: 'Nouveau titre',
      });

      expect(result.title).toBe('Nouveau titre');
      const updateCall = mockPrismaService.property.update.mock.calls[0][0];
      // Le slug doit être régénéré quand le titre change
      expect(updateCall.data.slug).toBe('nouveau-titre');
    });

    it('doit rejeter si le logement n\'existe pas (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'prop-1', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'utilisateur n\'est pas le propriétaire (403)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'autre-user',
      });

      await expect(
        service.update('user-1', 'prop-1', { title: 'X' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.property.update).not.toHaveBeenCalled();
    });
  });

  // ========================
  // ========================
  // DELETE
  // ========================

  describe('delete', () => {
    it('doit soft-deleter le logement', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'user-1',
      });
      mockPrismaService.property.update.mockResolvedValue({ id: 'prop-1', deletedAt: new Date() });

      const result = await service.delete('user-1', 'prop-1');

      expect(result.deleted).toBe(true);
      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('doit rejeter si le logement n\'existe pas (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'prop-1')).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'utilisateur n\'est pas le propriétaire (403)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'autre-user',
      });

      await expect(service.delete('user-1', 'prop-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ========================
  // FIND FOR MAP
  // ========================

  describe('findForMap', () => {
    it('doit retourner uniquement les champs légers pour la carte', async () => {
      mockPrismaService.city.findFirst.mockResolvedValue(null);
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'prop-1', title: 'Villa', pricePerNight: 85000, latitude: 5.36, longitude: -3.93 },
      ]);

      const result = await service.findForMap({});

      expect(result).toHaveLength(1);
      const call = mockPrismaService.property.findMany.mock.calls[0][0];
      // Seuls les champs nécessaires sont sélectionnés
      expect(call.select.id).toBe(true);
      expect(call.select.title).toBe(true);
      expect(call.select.pricePerNight).toBe(true);
      expect(call.select.latitude).toBe(true);
      expect(call.select.longitude).toBe(true);
      // Pas de description, pas d'images
      expect(call.select.description).toBeUndefined();
      expect(call.select.images).toBeUndefined();
    });
  });

  // ========================
  // GET AVAILABILITY
  // ========================

  describe('getAvailability', () => {
    it('doit retourner les disponibilités pour une plage de dates', async () => {
      const start = new Date(2026, 8, 1); // 1er sept
      const end = new Date(2026, 8, 30);  // 30 sept
      mockPrismaService.propertyAvailability.findMany.mockResolvedValue([
        { date: new Date(2026, 8, 5), status: 'AVAILABLE' },
        { date: new Date(2026, 8, 6), status: 'BOOKED' },
      ]);

      const result = await service.getAvailability('prop-1', start, end);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.propertyAvailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyId: 'prop-1',
            date: { gte: start, lte: end },
          },
          orderBy: { date: 'asc' },
        }),
      );
    });
  });
});