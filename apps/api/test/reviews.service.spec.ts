import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from '../src/modules/reviews/reviews.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

const mockNotificationsService = {
  create: jest.fn(),
};

const mockPrismaService = {
  booking: {
    findFirst: jest.fn(),
  },
  review: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  property: {
    update: jest.fn(),
  },
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  // ========================
  // CREATE REVIEW
  // ========================

  describe('createReview', () => {
    const dto = { rating: 5, comment: 'Super séjour', title: 'Excellent' };

    it('doit créer un avis et mettre à jour la note moyenne du logement', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        travelerId: 'user-1',
        propertyId: 'prop-1',
        status: 'CONFIRMED',
        checkOutDate: new Date('2026-01-01'),
        review: null,
        property: { id: 'prop-1', hostId: 'host-1', title: 'Villa Cocody' },
      });
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        bookingId: 'booking-1',
        propertyId: 'prop-1',
        reviewerId: 'user-1',
        revieweeId: 'host-1',
        rating: 5,
        comment: 'Super séjour',
        reviewer: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo', avatarUrl: null },
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 3 },
      });
      mockPrismaService.property.update.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.createReview('user-1', dto);

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Super séjour');

      // La note moyenne du logement est mise à jour
      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { propertyId: 'prop-1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { ratingAverage: 4.5, reviewCount: 3 },
      });

      // Notification hôte
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'host-1',
        'NEW_REVIEW',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ propertyId: 'prop-1', reviewId: 'review-1' }),
      );
    });

    it('doit rejeter si aucune réservation éligible (400)', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(service.createReview('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('doit stocker Prisma.JsonNull si photos vide', async () => {
      const dtoNoPhotos = { rating: 3, comment: 'Correct' };
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        propertyId: 'prop-1',
        status: 'CONFIRMED',
        checkOutDate: new Date('2026-01-01'),
        review: null,
        property: { hostId: 'host-1', title: 'Villa' },
      });
      mockPrismaService.review.create.mockResolvedValue({ id: 'review-1' });
      mockPrismaService.review.aggregate.mockResolvedValue({ _avg: { rating: 3 }, _count: { rating: 1 } });
      mockPrismaService.property.update.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await service.createReview('user-1', dtoNoPhotos);

      const createCall = mockPrismaService.review.create.mock.calls[0][0];
      expect(createCall.data.photos).toBeDefined();
    });
  });

  // ========================
  // GET PROPERTY REVIEWS
  // ========================

  describe('getPropertyReviews', () => {
    it('doit retourner les avis avec la moyenne calculée', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([
        { rating: 5, comment: 'Super' },
        { rating: 4, comment: 'Bien' },
        { rating: 3, comment: 'Correct' },
      ]);

      const result = await service.getPropertyReviews('prop-1');

      expect(result.reviews).toHaveLength(3);
      expect(result.total).toBe(3);
      // (5+4+3)/3 = 4.0
      expect(result.avgRating).toBe(4.0);
    });

    it('doit retourner 0 si aucun avis', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getPropertyReviews('prop-1');

      expect(result.reviews).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.avgRating).toBe(0);
    });

    it('doit arrondir la moyenne à 1 décimale', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
      ]);

      const result = await service.getPropertyReviews('prop-1');

      // (5+4+4)/3 = 4.333... → 4.3
      expect(result.avgRating).toBe(4.3);
    });
  });

  // ========================
  // REPLY TO REVIEW
  // ========================

  describe('replyToReview', () => {
    const dto = { reply: 'Merci pour votre avis !' };

    it('doit ajouter une réponse de l\'hôte', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        reviewerId: 'user-1',
        propertyId: 'prop-1',
        hostReply: null,
        property: { hostId: 'host-1' },
      });
      mockPrismaService.review.update.mockResolvedValue({
        id: 'review-1',
        hostReply: 'Merci pour votre avis !',
        hostRepliedAt: new Date(),
        reviewerId: 'user-1',
        reviewer: { id: 'user-1', firstName: 'Moussa', lastName: 'Diallo' },
      });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.replyToReview('review-1', 'host-1', dto);

      expect(result.hostReply).toBe('Merci pour votre avis !');
      expect(mockPrismaService.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' },
          data: expect.objectContaining({
            hostReply: 'Merci pour votre avis !',
          }),
        }),
      );

      // Notification voyageur
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-1',
        'REVIEW_REPLY',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ propertyId: 'prop-1', reviewId: 'review-1' }),
      );
    });

    it('doit rejeter si l\'avis n\'existe pas (404)', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.replyToReview('review-1', 'host-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('doit rejeter si l\'utilisateur n\'est pas l\'hôte (403)', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        propertyId: 'prop-1',
        hostReply: null,
        property: { hostId: 'autre-host' },
      });

      await expect(service.replyToReview('review-1', 'host-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('doit rejeter si l\'hôte a déjà répondu (400)', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        propertyId: 'prop-1',
        hostReply: 'Déjà répondu',
        property: { hostId: 'host-1' },
      });

      await expect(service.replyToReview('review-1', 'host-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ========================
  // CAN USER REVIEW
  // ========================

  describe('canUserReview', () => {
    it('doit retourner true si une réservation éligible existe', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
        checkOutDate: new Date('2026-01-01'),
        review: null,
      });

      const result = await service.canUserReview('user-1', 'prop-1');

      expect(result).toBe(true);
    });

    it('doit retourner false si aucune réservation éligible', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      const result = await service.canUserReview('user-1', 'prop-1');

      expect(result).toBe(false);
    });
  });
});