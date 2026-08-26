import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

const mockNotificationsService = {
  create: jest.fn(),
};

const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
  },
  booking: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  propertyAvailability: {
    findFirst: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  commission: {
    findFirst: jest.fn(),
  },
};

// Date dans le futur pour éviter les erreurs "date dans le passé"
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 2);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const formatDate = (d: Date) => d.toISOString().split('T')[0];

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE
  // ========================

  describe('create', () => {
    const baseDto = {
      propertyId: 'prop-1',
      checkInDate: formatDate(tomorrow),
      checkOutDate: formatDate(nextWeek),
      numberOfGuests: 2,
    };

    const publishedProperty = {
      id: 'prop-1',
      hostId: 'host-1',
      status: 'PUBLISHED',
      pricePerNight: 50000,
      minStayNights: 1,
      maxStayNights: 30,
      maxGuests: 8,
      currency: 'XOF',
      title: 'Villa Cocody',
      host: { id: 'host-1', firstName: 'Aminata', lastName: 'Koné' },
    };

    it('doit créer une réservation avec calcul correct des montants', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(publishedProperty);
      mockPrismaService.propertyAvailability.findFirst.mockResolvedValue(null);
      mockPrismaService.commission.findFirst.mockResolvedValue({
        percentage: 10,
        isActive: true,
        propertyTypeId: null,
      });
      mockPrismaService.booking.create.mockResolvedValue({
        id: 'booking-1',
        bookingNumber: 'AFS-XXX',
        totalAmount: 378000,
        serviceFee: 28000,
        commissionAmount: 35000,
        hostPayout: 315000,
        numberOfNights: 5,
        currency: 'XOF',
        property: publishedProperty,
        traveler: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', email: 'moussa@test.com' },
      });
      mockPrismaService.payment.create.mockResolvedValue({});
      mockPrismaService.propertyAvailability.createMany.mockResolvedValue({ count: 5 });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.create('user-1', baseDto);

      // Vérifie le calcul : 50000 × 5 = 250000 subtotal
      expect(result.payment.subtotal).toBe(250000);
      expect(result.payment.serviceFee).toBe(20000); // 8% de 250000
      expect(result.payment.commissionAmount).toBe(25000); // 10% de 250000
      expect(result.payment.hostPayout).toBe(225000); // 250000 - 25000
      expect(result.payment.totalAmount).toBe(270000); // 250000 + 20000
      expect(result.payment.nights).toBe(5);

      // Vérifie que le paiement est créé
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            amount: 270000,
            method: 'STRIPE',
            status: 'PENDING',
          }),
        }),
      );

      // Vérifie que les dates sont bloquées
      expect(mockPrismaService.propertyAvailability.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ propertyId: 'prop-1', status: 'BOOKED' }),
          ]),
        }),
      );

      // Vérifie la notification hôte
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'host-1',
        'BOOKING_REQUEST',
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('doit rejeter si le logement n\'existe pas (404)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', baseDto)).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'hôte réserve son propre logement (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...publishedProperty,
        hostId: 'user-1',
      });

      await expect(service.create('user-1', baseDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });

    it('doit rejeter si la date d\'arrivée est dans le passé (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(publishedProperty);
      const pastDto = {
        ...baseDto,
        checkInDate: '2020-01-01',
        checkOutDate: '2020-01-05',
      };

      await expect(service.create('user-1', pastDto)).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si la date de départ est avant ou égale à l\'arrivée (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(publishedProperty);
      const badDto = {
        ...baseDto,
        checkInDate: formatDate(nextWeek),
        checkOutDate: formatDate(tomorrow),
      };

      await expect(service.create('user-1', badDto)).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si la durée est inférieure au minimum (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...publishedProperty,
        minStayNights: 3,
      });

      const shortDto = {
        ...baseDto,
        checkOutDate: formatDate(new Date(tomorrow.getTime() + 86400000)), // 1 nuit
      };

      await expect(service.create('user-1', shortDto)).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si la durée dépasse le maximum (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...publishedProperty,
        maxStayNights: 3,
      });

      await expect(service.create('user-1', baseDto)).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si les dates chevauchent une période bloquée (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(publishedProperty);
      mockPrismaService.propertyAvailability.findFirst.mockResolvedValue({
        id: 'avail-1',
        date: tomorrow,
        status: 'BLOCKED',
      });

      await expect(service.create('user-1', baseDto)).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si trop de voyageurs (400)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...publishedProperty,
        maxGuests: 1,
      });

      await expect(service.create('user-1', baseDto)).rejects.toThrow(BadRequestException);
    });

    it('doit utiliser 10% de commission par défaut si aucune en base', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(publishedProperty);
      mockPrismaService.propertyAvailability.findFirst.mockResolvedValue(null);
      mockPrismaService.commission.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue({
        id: 'booking-1',
        property: publishedProperty,
        traveler: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', email: 'm@test.com' },
      });
      mockPrismaService.payment.create.mockResolvedValue({});
      mockPrismaService.propertyAvailability.createMany.mockResolvedValue({ count: 5 });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.create('user-1', baseDto);

      // 10% par défaut
      expect(result.payment.commissionAmount).toBe(25000); // 10% de 250000
    });
  });

  // ========================
  // FIND MINE
  // ========================

  describe('findMine', () => {
    it('doit retourner les réservations du voyageur', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([
        { id: 'booking-1', travelerId: 'user-1' },
      ]);

      const result = await service.findMine('user-1');

      expect(result).toHaveLength(1);
      const call = mockPrismaService.booking.findMany.mock.calls[0][0];
      expect(call.where.travelerId).toBe('user-1');
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  // ========================
  // FIND RECEIVED
  // ========================

  describe('findReceived', () => {
    it('doit retourner les réservations reçues par l\'hôte', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([
        { id: 'booking-1' },
      ]);

      const result = await service.findReceived('host-1');

      expect(result).toHaveLength(1);
      const call = mockPrismaService.booking.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ property: { hostId: 'host-1' } });
    });
  });

  // ========================
  // FIND ONE
  // ========================

  describe('findOne', () => {
    it('doit retourner la réservation avec ses relations', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING',
      });

      const result = await service.findOne('booking-1');

      expect(result.id).toBe('booking-1');
      const call = mockPrismaService.booking.findUnique.mock.calls[0][0];
      expect(call.include.property).toBeDefined();
      expect(call.include.traveler).toBeDefined();
      expect(call.include.payments).toBeDefined();
    });

    it('doit rejeter une réservation inexistante (404)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // ACCEPT
  // ========================

  describe('accept', () => {
    it('doit accepter une réservation en attente', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING',
        travelerId: 'user-1',
        propertyId: 'prop-1',
        traveler: { firstName: 'Moussa', lastName: 'Diallo' },
        property: { title: 'Villa Cocody' },
      });
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
        title: 'Villa Cocody',
      });
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.accept('booking-1', 'host-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'CONFIRMED' },
      });
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookingId: 'booking-1' },
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      // Notification voyageur
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-1',
        'BOOKING_CONFIRMED',
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('doit rejeter si la réservation n\'existe pas (404)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.accept('booking-1', 'host-1')).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'utilisateur n\'est pas l\'hôte (403)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING',
        propertyId: 'prop-1',
        traveler: { firstName: 'Moussa', lastName: 'Diallo' },
        property: { title: 'Villa' },
      });
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'autre-host',
      });

      await expect(service.accept('booking-1', 'host-1')).rejects.toThrow(ForbiddenException);
    });

    it('doit rejeter si la réservation n\'est plus en attente (400)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
        propertyId: 'prop-1',
        traveler: { firstName: 'Moussa', lastName: 'Diallo' },
        property: { title: 'Villa' },
      });
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
      });

      await expect(service.accept('booking-1', 'host-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ========================
  // REJECT
  // ========================

  describe('reject', () => {
    it('doit refuser et libérer les dates + rembourser', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING',
        travelerId: 'user-1',
        propertyId: 'prop-1',
        traveler: { firstName: 'Moussa', lastName: 'Diallo' },
        property: { title: 'Villa Cocody' },
      });
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        hostId: 'host-1',
      });
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.propertyAvailability.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.reject('booking-1', 'host-1');

      expect(result.success).toBe(true);
      // Statut CANCELLED avec raison
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancellationReason: "Refusé par l'hôte",
        }),
      });
      // Dates libérées
      expect(mockPrismaService.propertyAvailability.deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
      });
      // Paiement remboursé
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REFUNDED' }),
        }),
      );
      // Notification voyageur
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-1',
        'BOOKING_REJECTED',
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  // ========================
  // CANCEL
  // ========================

  describe('cancel', () => {
    it('doit annuler et libérer les dates + rembourser', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
        travelerId: 'user-1',
        propertyId: 'prop-1',
        property: { title: 'Villa', hostId: 'host-1' },
      });
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.propertyAvailability.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.cancel('booking-1', 'user-1', 'Change de plans');

      expect(result.success).toBe(true);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancellationReason: 'Change de plans',
        }),
      });
      // Notification hôte
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'host-1',
        'BOOKING_CANCELLED',
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('doit rejeter si ce n\'est pas le voyageur (403)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'autre-user',
        status: 'PENDING',
        property: { title: 'Villa', hostId: 'host-1' },
      });

      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('doit rejeter si déjà annulée (400)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'user-1',
        status: 'CANCELLED',
        property: { title: 'Villa', hostId: 'host-1' },
      });

      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('doit rejeter si déjà terminée (400)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'user-1',
        status: 'COMPLETED',
        property: { title: 'Villa', hostId: 'host-1' },
      });

      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ========================
  // CONFIRM PAYMENT
  // ========================

  describe('confirmPayment', () => {
    it('doit confirmer le paiement et passer en CONFIRMED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'user-1',
      });
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.confirmPayment('booking-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'CONFIRMED' },
      });
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
    });

    it('doit rejeter si ce n\'est pas le voyageur (403)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'autre-user',
      });

      await expect(service.confirmPayment('booking-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ========================
  // GET COMMISSION RATE
  // ========================

  describe('getCommissionRate', () => {
    it('doit retourner le taux de la commission active', async () => {
      mockPrismaService.commission.findFirst.mockResolvedValue({
        percentage: 12,
        isActive: true,
        propertyTypeId: null,
      });

      const rate = await service.getCommissionRate();

      expect(rate).toBe(0.12);
    });

    it('doit retourner 10% par défaut si aucune commission', async () => {
      mockPrismaService.commission.findFirst.mockResolvedValue(null);

      const rate = await service.getCommissionRate();

      expect(rate).toBe(0.10);
    });
  });
});