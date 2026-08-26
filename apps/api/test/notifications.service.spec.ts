import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockPrismaService = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE
  // ========================

  describe('create', () => {
    it('doit créer une notification avec data sérialisé', async () => {
      mockPrismaService.notification.create.mockResolvedValue({ id: 'notif-1' });

      await service.create('user-1', 'BOOKING_REQUEST', 'Nouvelle demande', 'Moussa a réservé', { bookingId: 'b1' });

      const call = mockPrismaService.notification.create.mock.calls[0][0];
      expect(call.data.userId).toBe('user-1');
      expect(call.data.type).toBe('BOOKING_REQUEST');
      expect(call.data.title).toBe('Nouvelle demande');
      expect(call.data.message).toBe('Moussa a réservé');
      // data doit être un objet pur (pas une référence)
      expect(call.data.data).toEqual({ bookingId: 'b1' });
    });

    it('doit créer sans data si non fourni', async () => {
      mockPrismaService.notification.create.mockResolvedValue({ id: 'notif-2' });

      await service.create('user-1', 'PROMOTION', 'Promo', '10% de réduction');

      const call = mockPrismaService.notification.create.mock.calls[0][0];
      expect(call.data.data).toBeNull();
    });
  });

  // ========================
  // LIST
  // ========================

  describe('list', () => {
    it('doit retourner les 50 dernières notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        { id: 'notif-1', type: 'BOOKING_REQUEST', isRead: false },
        { id: 'notif-2', type: 'NEW_MESSAGE', isRead: true },
      ]);

      const result = await service.list('user-1');

      expect(result).toHaveLength(2);
      const call = mockPrismaService.notification.findMany.mock.calls[0][0];
      expect(call.where.userId).toBe('user-1');
      expect(call.take).toBe(50);
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
      // Seuls les champs sélectionnés
      expect(call.select.id).toBe(true);
      expect(call.select.type).toBe(true);
      expect(call.select.title).toBe(true);
      expect(call.select.message).toBe(true);
      expect(call.select.data).toBe(true);
      expect(call.select.isRead).toBe(true);
      expect(call.select.createdAt).toBe(true);
    });

    it('doit filtrer les non-lues si unreadOnly=true', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.list('user-1', true);

      const call = mockPrismaService.notification.findMany.mock.calls[0][0];
      expect(call.where.isRead).toBe(false);
    });

    it('doit retourner tout si unreadOnly=false (défaut)', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.list('user-1', false);

      const call = mockPrismaService.notification.findMany.mock.calls[0][0];
      expect(call.where.isRead).toBeUndefined();
    });
  });

  // ========================
  // COUNT UNREAD
  // ========================

  describe('countUnread', () => {
    it('doit retourner le nombre de notifications non lues', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.countUnread('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });

    it('doit retourner 0 si aucune non lue', async () => {
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.countUnread('user-1');

      expect(result).toBe(0);
    });
  });

  // ========================
  // MARK AS READ
  // ========================

  describe('markAsRead', () => {
    it('doit marquer une notification comme lue', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: false,
      });
      mockPrismaService.notification.update.mockResolvedValue({ id: 'notif-1', isRead: true });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('doit ne rien faire si la notification n\'existe pas', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result).toBeUndefined();
      expect(mockPrismaService.notification.update).not.toHaveBeenCalled();
    });

    it('doit ne rien faire si la notification appartient à un autre utilisateur', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'autre-user',
        isRead: false,
      });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result).toBeUndefined();
      expect(mockPrismaService.notification.update).not.toHaveBeenCalled();
    });
  });

  // ========================
  // MARK ALL AS READ
  // ========================

  describe('markAllAsRead', () => {
    it('doit marquer toutes les non-lues comme lues', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });
});