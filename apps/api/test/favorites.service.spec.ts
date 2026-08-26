import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from '../src/modules/favorites/favorites.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockPrismaService = {
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  // ========================
  // LIST
  // ========================

  describe('list', () => {
    it('doit retourner uniquement les propriétés (pas le wrapper favorite)', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([
        { property: { id: 'prop-1', title: 'Villa' } },
        { property: { id: 'prop-2', title: 'Appart' } },
      ]);

      const result = await service.list('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'prop-1', title: 'Villa' });
      expect(result[0]).not.toHaveProperty('userId');
      const call = mockPrismaService.favorite.findMany.mock.calls[0][0];
      expect(call.where.userId).toBe('user-1');
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('doit retourner un tableau vide si aucun favori', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const result = await service.list('user-1');

      expect(result).toHaveLength(0);
    });
  });

  // ========================
  // TOGGLE
  // ========================

  describe('toggle', () => {
    it('doit ajouter aux favoris si non existant', async () => {
      mockPrismaService.favorite.findUnique.mockResolvedValue(null);
      mockPrismaService.favorite.create.mockResolvedValue({});

      const result = await service.toggle('user-1', 'prop-1');

      expect(result.favorited).toBe(true);
      expect(mockPrismaService.favorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', propertyId: 'prop-1' },
      });
      expect(mockPrismaService.favorite.delete).not.toHaveBeenCalled();
    });

    it('doit retirer des favoris si déjà existant', async () => {
      mockPrismaService.favorite.findUnique.mockResolvedValue({
        userId: 'user-1',
        propertyId: 'prop-1',
      });
      mockPrismaService.favorite.delete.mockResolvedValue({});

      const result = await service.toggle('user-1', 'prop-1');

      expect(result.favorited).toBe(false);
      expect(mockPrismaService.favorite.delete).toHaveBeenCalledWith({
        where: { userId_propertyId: { userId: 'user-1', propertyId: 'prop-1' } },
      });
      expect(mockPrismaService.favorite.create).not.toHaveBeenCalled();
    });
  });

  // ========================
  // CHECK
  // ========================

  describe('check', () => {
    it('doit retourner true si en favori', async () => {
      mockPrismaService.favorite.findUnique.mockResolvedValue({
        userId: 'user-1',
        propertyId: 'prop-1',
      });

      const result = await service.check('user-1', 'prop-1');

      expect(result).toBe(true);
    });

    it('doit retourner false si pas en favori', async () => {
      mockPrismaService.favorite.findUnique.mockResolvedValue(null);

      const result = await service.check('user-1', 'prop-1');

      expect(result).toBe(false);
    });
  });

  // ========================
  // CHECK MANY
  // ========================

  describe('checkMany', () => {
    it('doit retourner un map avec true/false pour chaque ID', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([
        { propertyId: 'prop-1' },
        { propertyId: 'prop-3' },
      ]);

      const result = await service.checkMany('user-1', ['prop-1', 'prop-2', 'prop-3']);

      expect(result).toEqual({
        'prop-1': true,
        'prop-2': false,
        'prop-3': true,
      });
    });

    it('doit retourner tout false si aucun favori', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const result = await service.checkMany('user-1', ['prop-1', 'prop-2']);

      expect(result).toEqual({
        'prop-1': false,
        'prop-2': false,
      });
    });

    it('doit gérer un tableau vide', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const result = await service.checkMany('user-1', []);

      expect(result).toEqual({});
    });
  });
});