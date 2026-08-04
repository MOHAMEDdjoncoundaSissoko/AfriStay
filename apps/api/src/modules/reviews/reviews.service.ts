import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    // Trouver une réservation terminée de cet utilisateur SANS avis
    const booking = await this.prisma.booking.findFirst({
      where: {
        travelerId: reviewerId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        checkOutDate: { lt: new Date() },
        review: null,
      },
      include: { property: true },
    });

    if (!booking) {
      throw new BadRequestException(
        'Aucune réservation terminée sans avis trouvée',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        reviewerId,
        revieweeId: booking.property.hostId,
        rating: dto.rating,
        title: dto.title || null,
        comment: dto.comment,
        photos: dto.photos?.length ? dto.photos : Prisma.JsonNull,
      },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Mettre à jour la note moyenne du logement
    await this.updatePropertyRating(booking.propertyId);

    // Notification hôte
    await this.notificationsService.create(
      booking.property.hostId,
      'NEW_REVIEW',
      'Nouvel avis',
      `Nouvel avis de ${dto.rating} étoiles sur ${booking.property.title || 'votre logement'}`,
      { propertyId: booking.propertyId, reviewId: review.id },
    );

    return review;
  }

  async getPropertyReviews(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { propertyId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const avgRating =
      total > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;

    return { reviews, total, avgRating };
  }

  async replyToReview(reviewId: string, hostId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true },
    });

    if (!review) throw new NotFoundException('Avis introuvable');
    if (review.property.hostId !== hostId) {
      throw new ForbiddenException('Seul lhôte de ce logement peut répondre');
    }
    if (review.hostReply) {
      throw new BadRequestException('Vous avez déjà répondu à cet avis');
    }

        const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostReply: dto.reply,
        hostRepliedAt: new Date(),
      },
      include: { reviewer: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Notification voyageur
    await this.notificationsService.create(
      updated.reviewerId,
      'REVIEW_REPLY',
      'Réponse à votre avis',
      `L'hôte a répondu à votre avis`,
      { propertyId: review.propertyId, reviewId },
    );

    return updated;
  }

  async canUserReview(userId: string, propertyId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        travelerId: userId,
        propertyId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        checkOutDate: { lt: new Date() },
        review: null,
      },
    });
    return !!booking;
  }

  private async updatePropertyRating(propertyId: string) {
    const result = await this.prisma.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ratingAverage: result._avg.rating || 0,
        reviewCount: result._count.rating,
      },
    });
  }
}