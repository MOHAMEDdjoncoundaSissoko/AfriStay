import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from '../src/modules/messages/messages.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

const mockNotificationsService = {
  create: jest.fn(),
};

const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
  },
  conversation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  conversationParticipant: {
    findFirst: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE CONVERSATION
  // ========================

  describe('createConversation', () => {
    const dto = { propertyId: 'prop-1', message: 'Bonjour, le logement est-il dispo ?' };

    it('doit créer une conversation + envoyer le premier message', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
        title: 'Villa Cocody',
      });
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({
        id: 'conv-1',
        propertyId: 'prop-1',
        participants: [
          { userId: 'user-1', user: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', avatarUrl: null } },
          { userId: 'host-1', user: { id: 'host-1', firstName: 'Aminata', lastName: 'Koné', avatarUrl: null } },
        ],
        property: { id: 'prop-1', title: 'Villa Cocody', images: [] },
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Bonjour, le logement est-il dispo ?',
      });
      mockPrismaService.conversation.update.mockResolvedValue({});

      const result = await service.createConversation('user-1', dto);

      expect(result.conversation.id).toBe('conv-1');
      expect(result.message.content).toBe('Bonjour, le logement est-il dispo ?');

      // 2 participants créés
      const createCall = mockPrismaService.conversation.create.mock.calls[0][0];
      expect(createCall.data.participants.create).toHaveLength(2);
      expect(createCall.data.participants.create[0].userId).toBe('user-1');
      expect(createCall.data.participants.create[1].userId).toBe('host-1');

      // lastMessageAt mis à jour
      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('doit réutiliser une conversation existante pour le même logement', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
        title: 'Villa',
      });
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-existante',
        participants: [],
        property: { id: 'prop-1', title: 'Villa', images: [] },
      });
      mockPrismaService.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrismaService.conversation.update.mockResolvedValue({});

      const result = await service.createConversation('user-1', dto);

      expect(result.conversation.id).toBe('conv-existante');
      // Pas de nouvelle conversation créée
      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
    });

    it('doit rejeter si le logement n\'existe pas (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.createConversation('user-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'hôte essaie de se parler à lui-même (403)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
        title: 'Villa',
      });

      await expect(service.createConversation('host-1', dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.conversation.findFirst).not.toHaveBeenCalled();
    });
  });

  // ========================
  // GET MY CONVERSATIONS
  // ========================

  describe('getMyConversations', () => {
    it('doit retourner les conversations avec l\'autre utilisateur et le dernier message', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([
        {
          id: 'conv-1',
          property: { id: 'prop-1', title: 'Villa', images: [] },
          participants: [
            { userId: 'user-1', user: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', avatarUrl: null } },
            { userId: 'host-1', user: { id: 'host-1', firstName: 'Aminata', lastName: 'Koné', avatarUrl: null } },
          ],
          messages: [{ content: 'Bonjour', createdAt: new Date() }],
        },
      ]);

      const result = await service.getMyConversations('user-1');

      expect(result).toHaveLength(1);
      // L'autre utilisateur = Aminata (pas Moussa)
      expect(result[0].otherUser!.firstName).toBe('Aminata');
      // Dernier message
      expect(result[0].lastMessage!.content).toBe('Bonjour');
      // Pas de sender dans le lastMessage retourné
      expect(result[0].lastMessage).not.toHaveProperty('senderId');
    });

    it('doit retourner lastMessage null si aucun message', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([
        {
          id: 'conv-1',
          property: { id: 'prop-1', title: 'Villa', images: [] },
          participants: [
            { userId: 'user-1', user: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', avatarUrl: null } },
            { userId: 'host-1', user: { id: 'host-1', firstName: 'Aminata', lastName: 'Koné', avatarUrl: null } },
          ],
          messages: [],
        },
      ]);

      const result = await service.getMyConversations('user-1');

      expect(result[0].lastMessage).toBeNull();
    });

    it('doit ordonner par lastMessageAt descendant', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await service.getMyConversations('user-1');

      const call = mockPrismaService.conversation.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ lastMessageAt: 'desc' });
    });
  });

  // ========================
  // GET MESSAGES
  // ========================

  describe('getMessages', () => {
    it('doit retourner les messages ordonnés par date ascendante', async () => {
      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue({ conversationId: 'conv-1', userId: 'user-1' });
      mockPrismaService.message.findMany.mockResolvedValue([
        { id: 'msg-1', content: 'Premier', createdAt: new Date('2026-01-01'), sender: { firstName: 'Moussa' } },
        { id: 'msg-2', content: 'Deuxième', createdAt: new Date('2026-01-02'), sender: { firstName: 'Aminata' } },
      ]);

      const result = await service.getMessages('user-1', 'conv-1');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Premier');
      expect(result[1].content).toBe('Deuxième');
      const call = mockPrismaService.message.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'asc' });
    });

    it('doit rejeter si l\'utilisateur n\'est pas participant (403)', async () => {
      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(service.getMessages('user-1', 'conv-1')).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.message.findMany).not.toHaveBeenCalled();
    });
  });

  // ========================
  // SEND MESSAGE
  // ========================

  describe('sendMessage', () => {
    const dto = { content: 'Merci pour l\'info !' };

    it('doit envoyer un message et notifier l\'autre participant', async () => {
      mockPrismaService.conversationParticipant.findFirst
        .mockResolvedValueOnce({ conversationId: 'conv-1', userId: 'user-1' }) // vérif accès
        .mockResolvedValueOnce({ // autre participant
          userId: 'host-1',
          user: { id: 'host-1', firstName: 'Aminata' },
        });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Merci pour l\'info !',
        sender: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo' },
      });
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.sendMessage('user-1', 'conv-1', dto);

      expect(result.content).toBe('Merci pour l\'info !');

      // lastMessageAt mis à jour
      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastMessageAt: expect.any(Date) },
      });

      // Notification envoyée à l'autre participant
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'host-1',
        'NEW_MESSAGE',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ conversationId: 'conv-1' }),
      );
    });

    it('doit tronquer le message à 80 caractères dans la notification', async () => {
      const longDto = { content: 'A'.repeat(120) };
      mockPrismaService.conversationParticipant.findFirst
        .mockResolvedValueOnce({ conversationId: 'conv-1', userId: 'user-1' })
        .mockResolvedValueOnce({
          userId: 'host-1',
          user: { id: 'host-1', firstName: 'Aminata' },
        });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-3',
        senderId: 'user-1',
        content: longDto.content,
        sender: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo' },
      });
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await service.sendMessage('user-1', 'conv-1', longDto);

      const notificationMsg = mockNotificationsService.create.mock.calls[0][3];
      //expect(notificationMsg.length).toBeLessThanOrEqual(83); // 80 + '...'
      expect(notificationMsg.length).toBeLessThanOrEqual(93); // "Moussa : " (9) + 80 + "..." (3)
      expect(notificationMsg.endsWith('...')).toBe(true);
    });

    it('doit rejeter si l\'utilisateur n\'est pas participant (403)', async () => {
      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(service.sendMessage('user-1', 'conv-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });
});