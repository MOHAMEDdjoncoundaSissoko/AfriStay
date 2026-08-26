import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../src/modules/admin/admin.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockPrismaService = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  property: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  userVerification: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  adminLog: {
    create: jest.fn(),
  },
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  // ========================
  // DASHBOARD
  // ========================

  describe('getDashboard', () => {
    it('doit retourner les stats du dashboard', async () => {
      mockPrismaService.user.count.mockResolvedValue(150);
      mockPrismaService.property.count.mockResolvedValue(45);
      mockPrismaService.booking.count.mockResolvedValue(320);
      mockPrismaService.booking.aggregate.mockResolvedValue({
        _sum: { commissionAmount: 750000 },
      });
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', firstName: 'Moussa', lastName: 'Diallo', email: 'm@test.com', roles: ['TRAVELER'], createdAt: new Date() },
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([
        { traveler: { firstName: 'Moussa' }, property: { title: 'Villa' } },
      ]);
      mockPrismaService.userVerification.count.mockResolvedValue(3);

      const result = await service.getDashboard();

      expect(result.totalUsers).toBe(150);
      expect(result.totalProperties).toBe(45);
      expect(result.totalBookings).toBe(320);
      expect(result.monthlyRevenue).toBe(750000);
      expect(result.pendingVerifications).toBe(3);
      expect(result.recentUsers).toHaveLength(1);
      expect(result.recentBookings).toHaveLength(1);

      // Le revenu mensuel filtre sur CONFIRMED + mois en cours
      const aggCall = mockPrismaService.booking.aggregate.mock.calls[0][0];
      expect(aggCall.where.status).toBe('CONFIRMED');
      expect(aggCall.where.createdAt.gte).toBeInstanceOf(Date);
    });

    it('doit retourner 0 si pas de revenus ce mois', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.property.count.mockResolvedValue(0);
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.aggregate.mockResolvedValue({ _sum: { commissionAmount: null } });
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.userVerification.count.mockResolvedValue(0);

      const result = await service.getDashboard();

      expect(result.monthlyRevenue).toBe(0);
    });
  });

  // ========================
  // GET USERS
  // ========================

  describe('getUsers', () => {
    it('doit retourner les utilisateurs avec pagination', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', firstName: 'Moussa', _count: { properties: 2, bookings: 5 } },
      ]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.getUsers({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      const call = mockPrismaService.user.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
      expect(call.select._count).toBeDefined();
    });

    it('doit filtrer par recherche sur nom, prénom, email', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getUsers({ search: 'diallo' });

      const call = mockPrismaService.user.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(3);
      expect(call.where.OR[0].firstName).toEqual({ contains: 'diallo', mode: 'insensitive' });
      expect(call.where.OR[1].lastName).toEqual({ contains: 'diallo', mode: 'insensitive' });
      expect(call.where.OR[2].email).toEqual({ contains: 'diallo', mode: 'insensitive' });
    });

    it('doit filtrer par statut ACTIVE', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getUsers({ status: 'ACTIVE' });

      const call = mockPrismaService.user.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
    });

    it('doit filtrer par statut DISABLED', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getUsers({ status: 'DISABLED' });

      const call = mockPrismaService.user.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(false);
    });

    it('doit limiter à 50 maximum et minimum 1', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getUsers({ limit: '100' });

      const call = mockPrismaService.user.findMany.mock.calls[0][0];
      expect(call.take).toBe(50);
    });
  });

  // ========================
  // UPDATE USER ROLE
  // ========================

  describe('updateUserRole', () => {
    it('doit changer les rôles et logger l\'action', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        roles: ['TRAVELER'],
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        firstName: 'Moussa',
        lastName: 'Diallo',
        email: 'm@test.com',
        roles: ['HOST'],
      });
      mockPrismaService.adminLog.create.mockResolvedValue({});

      const result = await service.updateUserRole('u1', { roles: ['HOST'] }, 'admin-1');

      expect(result.roles).toEqual(['HOST']);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { roles: ['HOST'] },
        select: expect.any(Object),
      });

      // Log créé
      const logCall = mockPrismaService.adminLog.create.mock.calls[0][0];
      expect(logCall.data.action).toBe('UPDATE_USER_ROLE');
      expect(logCall.data.details.oldRoles).toEqual(['TRAVELER']);
      expect(logCall.data.details.newRoles).toEqual(['HOST']);
    });

    it('doit rejeter un utilisateur inexistant (404)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserRole('u1', { roles: ['HOST'] }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // TOGGLE USER STATUS
  // ========================

  describe('toggleUserStatus', () => {
    it('doit activer un utilisateur', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1', firstName: 'Moussa', lastName: 'Diallo', isActive: true,
      });
      mockPrismaService.adminLog.create.mockResolvedValue({});

      const result = await service.toggleUserStatus('u1', { status: 'ACTIVE' }, 'admin-1');

      expect(result.isActive).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: true },
        select: expect.any(Object),
      });
    });

    it('doit désactiver un utilisateur', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1', firstName: 'Moussa', lastName: 'Diallo', isActive: false,
      });
      mockPrismaService.adminLog.create.mockResolvedValue({});

      const result = await service.toggleUserStatus('u1', { status: 'DISABLED' }, 'admin-1');

      expect(result.isActive).toBe(false);
    });

    it('doit rejeter un utilisateur inexistant (404)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleUserStatus('u1', { status: 'ACTIVE' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // GET PROPERTIES
  // ========================

  describe('getProperties', () => {
    it('doit retourner les logements avec pagination', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'p1', title: 'Villa', images: [{ url: 'img.jpg' }], host: { firstName: 'Aminata' } },
      ]);
      mockPrismaService.property.count.mockResolvedValue(1);

      const result = await service.getProperties({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      const call = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('doit filtrer par statut', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.getProperties({ status: 'DRAFT' });

      const call = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('DRAFT');
    });

    it('doit filtrer par recherche sur titre', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.getProperties({ search: 'villa' });

      const call = mockPrismaService.property.findMany.mock.calls[0][0];
      expect(call.where.title).toEqual({ contains: 'villa', mode: 'insensitive' });
    });
  });

  // ========================
  // UPDATE PROPERTY STATUS
  // ========================

  describe('updatePropertyStatus', () => {
    it('doit changer le statut et logger avec l\'ancien et le nouveau', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'DRAFT',
      });
      mockPrismaService.property.update.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });
      mockPrismaService.adminLog.create.mockResolvedValue({});

      const result = await service.updatePropertyStatus('p1', { status: 'PUBLISHED' }, 'admin-1');

      expect(result.status).toBe('PUBLISHED');

      const logCall = mockPrismaService.adminLog.create.mock.calls[0][0];
      expect(logCall.data.details.oldStatus).toBe('DRAFT');
      expect(logCall.data.details.newStatus).toBe('PUBLISHED');
    });

    it('doit rejeter un logement inexistant (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePropertyStatus('p1', { status: 'ARCHIVED' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // GET VERIFICATIONS
  // ========================

  describe('getVerifications', () => {
    it('doit retourner les vérifications avec pagination', async () => {
      mockPrismaService.userVerification.findMany.mockResolvedValue([
        { id: 'v1', status: 'PENDING', user: { firstName: 'Moussa', lastName: 'Diallo' } },
      ]);
      mockPrismaService.userVerification.count.mockResolvedValue(1);

      const result = await service.getVerifications({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      const call = mockPrismaService.userVerification.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('doit filtrer par statut', async () => {
      mockPrismaService.userVerification.findMany.mockResolvedValue([]);
      mockPrismaService.userVerification.count.mockResolvedValue(0);

      await service.getVerifications({ status: 'PENDING' });

      const call = mockPrismaService.userVerification.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('PENDING');
    });
  });

  // ========================
  // REVIEW VERIFICATION
  // ========================

  describe('reviewVerification', () => {
    it('doit approuver et marquer l\'utilisateur comme vérifié', async () => {
      mockPrismaService.userVerification.findUnique.mockResolvedValue({
        id: 'v1',
        userId: 'u1',
        status: 'PENDING',
      });
      mockPrismaService.userVerification.update.mockResolvedValue({
        id: 'v1',
        status: 'APPROVED',
        user: { id: 'u1', isVerified: false },
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.adminLog.create.mockResolvedValue({});

      const result = await service.reviewVerification('v1', { status: 'APPROVED' }, 'admin-1');

      expect(result.status).toBe('APPROVED');

      // L'utilisateur doit être marqué vérifié
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isVerified: true },
      });

      // Log
      const logCall = mockPrismaService.adminLog.create.mock.calls[0][0];
      expect(logCall.data.action).toBe('REVIEW_VERIFICATION');
      expect(logCall.data.details.status).toBe('APPROVED');
    });

    it('doit refuser sans marquer l\'utilisateur comme vérifié', async () => {
      mockPrismaService.userVerification.findUnique.mockResolvedValue({
        id: 'v1',
        userId: 'u1',
        status: 'PENDING',
      });
      mockPrismaService.userVerification.update.mockResolvedValue({
        id: 'v1',
        status: 'REJECTED',
        user: { id: 'u1', isVerified: false },
      });
      mockPrismaService.adminLog.create.mockResolvedValue({});

      await service.reviewVerification('v1', { status: 'REJECTED', reason: 'Document illisible' }, 'admin-1');

      // L'utilisateur NE doit PAS être marqué vérifié
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();

      // La raison doit être dans le log
      const logCall = mockPrismaService.adminLog.create.mock.calls[0][0];
      expect(logCall.data.details.reason).toBe('Document illisible');
    });

    it('doit rejeter une vérification inexistante (404)', async () => {
      mockPrismaService.userVerification.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewVerification('v1', { status: 'APPROVED' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // LOG ACTION
  // ========================

  describe('logAction (privé)', () => {
    it('doit créer un log sans casser si erreur', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', roles: ['TRAVELER'] });
      mockPrismaService.user.update.mockResolvedValue({ id: 'u1', roles: ['HOST'] });
      mockPrismaService.adminLog.create.mockRejectedValue(new Error('DB error'));

      // Ne doit pas throw
      const result = await service.updateUserRole('u1', { roles: ['HOST'] }, 'admin-1');

      expect(result.roles).toEqual(['HOST']);
    });
  });
});