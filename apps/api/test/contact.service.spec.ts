import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from '../src/modules/contact/contact.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockPrismaService = {
  contact: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE
  // ========================

  describe('create', () => {
    it('doit créer un message de contact avec les champs du DTO', async () => {
      const dto = {
        firstName: 'Moussa',
        lastName: 'Diallo',
        email: 'moussa@test.com',
        subject: 'Problème de réservation',
        message: 'Je n\'arrive pas à réserver',
      };
      mockPrismaService.contact.create.mockResolvedValue({ id: 'contact-1', ...dto });

      const result = await service.create(dto);

      expect(result.firstName).toBe('Moussa');
      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({ data: dto });
    });

    it('doit créer avec userId si fourni', async () => {
      const dto = {
        firstName: 'Moussa',
        lastName: 'Diallo',
        email: 'moussa@test.com',
        subject: 'Question',
        message: 'Hello',
        userId: 'user-1',
      };
      mockPrismaService.contact.create.mockResolvedValue({ id: 'contact-2' });

      await service.create(dto);

      const call = mockPrismaService.contact.create.mock.calls[0][0];
      expect(call.data.userId).toBe('user-1');
    });
  });

  // ========================
  // FIND ALL
  // ========================

  describe('findAll', () => {
    it('doit retourner tous les contacts ordonnés par date décroissante', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { id: 'contact-1', subject: 'A' },
        { id: 'contact-2', subject: 'B' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      const call = mockPrismaService.contact.findMany.mock.calls[0][0];
      expect(call.where).toBeUndefined();
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('doit filtrer par userId si fourni', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { id: 'contact-1', userId: 'user-1' },
      ]);

      await service.findAll('user-1');

      const call = mockPrismaService.contact.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ userId: 'user-1' });
    });
  });

  // ========================
  // REPLY
  // ========================

  describe('reply', () => {
    it('doit ajouter une réponse à un contact', async () => {
      mockPrismaService.contact.update.mockResolvedValue({
        id: 'contact-1',
        reply: 'Nous avons bien reçu votre message.',
      });

      const result = await service.reply('contact-1', 'Nous avons bien reçu votre message.');

      expect(result.reply).toBe('Nous avons bien reçu votre message.');
      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { reply: 'Nous avons bien reçu votre message.' },
      });
    });
  });
});