import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  //constructor(private prisma: PrismaService) {}
  constructor(
  private prisma: PrismaService,
  private notificationsService: NotificationsService,) {}

  async create(userId: string, dto: CreateBookingDto) {
    const { propertyId, checkInDate, checkOutDate, numberOfGuests } = dto;

    // Vérifier la propriété
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId, status: 'PUBLISHED' },
      include: { host: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!property) throw new NotFoundException('Logement non trouvé');

    // Vérifier que l'hôte ne réserve pas son propre logement
    if (property.hostId === userId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre logement');
    }

    // Vérifier les dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) throw new BadRequestException('La date d\'arrivée ne peut pas être dans le passé');
    if (checkOut <= checkIn) throw new BadRequestException('La date de départ doit être après la date d\'arrivée');

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < property.minStayNights) {
      throw new BadRequestException(`Durée minimum : ${property.minStayNights} nuits`);
    }
    if (property.maxStayNights && nights > property.maxStayNights) {
      throw new BadRequestException(`Durée maximum : ${property.maxStayNights} nuits`);
    }

    // Vérifier les disponibilités
    const overlapping = await this.prisma.propertyAvailability.findFirst({
      where: {
        propertyId,
        date: { gte: checkIn, lt: checkOut },
        status: { in: ['BLOCKED', 'BOOKED'] },
      },
    });
    if (overlapping) throw new BadRequestException('Ces dates ne sont pas disponibles');

    // Vérifier les voyageurs max
    if (numberOfGuests > property.maxGuests) {
      throw new BadRequestException(`${property.maxGuests} voyageurs maximum`);
    }

    // Calcul des montants
    const subtotal = property.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.08);
    const commissionRate = await this.getCommissionRate();
    const commissionAmount = Math.round(subtotal * commissionRate);
    const hostPayout = subtotal - commissionAmount;
    const totalAmount = subtotal + serviceFee;

    // Générer le numéro de réservation
    const bookingNumber = 'AFS-' + Date.now().toString(36).toUpperCase();

    // Créer la réservation
    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        travelerId: userId,
        propertyId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights: nights,
        numberOfGuests,
        totalAmount,
        serviceFee,
        commissionAmount,
        hostPayout,
        currency: property.currency,
        status: 'PENDING',
        specialRequests: dto.specialRequests || null,
      },
      include: {
        property: {
          include: {
            city: true,
            country: true,
            propertyType: true,
            images: { where: { isCover: true }, take: 1 },
          },
        },
        traveler: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Créer une notification pour l'hôte
    await this.notificationsService.create(
      booking.property.hostId,
      'BOOKING_REQUEST',
      'Nouvelle demande de réservation',
      `${booking.traveler.firstName} ${booking.traveler.lastName} souhaite réserver ${booking.property.title}`,
      {
        propertyId: booking.property.id,
        propertyTitle: booking.property.title,
        bookingId: booking.id,
        amount: booking.totalAmount,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
      },
    );

    // Créer le paiement
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        currency: property.currency,
        method: 'STRIPE',
        status: 'PENDING',
      },
    });

    // Bloquer les dates
    const dates = [];
    const current = new Date(checkIn);
    while (current < checkOut) {
      dates.push({
        propertyId,
        date: new Date(current),
        status: 'BOOKED',
        bookingId: booking.id,
      });
      current.setDate(current.getDate() + 1);
    }
    await this.prisma.propertyAvailability.createMany({ data: dates });

    return {
      booking,
      payment: {
        subtotal,
        serviceFee,
        commissionAmount,
        hostPayout,
        totalAmount,
        nights,
        currency: property.currency,
      },
    };
  }

  async getCommissionRate(): Promise<number> {
    const commission = await this.prisma.commission.findFirst({
      where: { isActive: true, propertyTypeId: null },
    });
    return commission ? commission.percentage / 100 : 0.10;
  }

  async findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { travelerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: { select: { name: true } },
            country: { select: { name: true, flagEmoji: true } },
            images: { where: { isCover: true }, take: 1 },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReceived(userId: string) {
    return this.prisma.booking.findMany({
      where: { property: { hostId: userId } },
      include: {
        traveler: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: { where: { isCover: true }, take: 1 },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: { city: true, country: true, propertyType: true, images: { orderBy: { sortOrder: 'asc' } } },
        },
        traveler: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payments: true,
      },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }

  async confirmPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.travelerId !== userId) throw new ForbiddenException('Non autorisé');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    });

    return { success: true, message: 'Paiement confirmé' };
  }

  async accept(bookingId: string, hostId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        traveler: { select: { firstName: true, lastName: true } },
        property: { select: { title: true } },
      },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    
    const property = await this.prisma.property.findUnique({ where: { id: booking.propertyId } });
    if (property?.hostId !== hostId) throw new ForbiddenException('Seul l\'hôte peut valider');
    if (booking.status !== 'PENDING') throw new BadRequestException('Cette réservation n\'est plus en attente');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    });

    // Notification voyageur
    await this.notificationsService.create(
      booking.travelerId,
      'BOOKING_CONFIRMED',
      'Réservation confirmée',
      `${property?.title || 'Votre logement'} a confirmé votre réservation`,
      { bookingId, propertyId: booking.propertyId },
    );

    return { success: true, message: 'Réservation acceptée' };
  }

  async reject(bookingId: string, hostId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        traveler: { select: { firstName: true, lastName: true } },
        property: { select: { title: true } },
      },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');

    const property = await this.prisma.property.findUnique({ where: { id: booking.propertyId } });
    if (property?.hostId !== hostId) throw new ForbiddenException('Seul l\'hôte peut refuser');
    if (booking.status !== 'PENDING') throw new BadRequestException('Cette réservation n\'est plus en attente');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancellationReason: 'Refusé par l\'hôte', cancelledAt: new Date() },
    });

    await this.prisma.propertyAvailability.deleteMany({ where: { bookingId } });

    await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    // Notification voyageur
    await this.notificationsService.create(
      booking.travelerId,
      'BOOKING_REJECTED',
      'Réservation refusée',
      `Votre réservation pour ${booking.property.title || 'ce logement'} a été refusée par l'hôte`,
      { bookingId, propertyId: booking.propertyId },
    );

    return { success: true, message: 'Réservation refusée' };
  }

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { title: true, hostId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.travelerId !== userId) throw new ForbiddenException('Non autorisé');
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cette réservation ne peut plus être annulée');
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancellationReason: reason || null, cancelledAt: new Date() },
    });

    await this.prisma.propertyAvailability.deleteMany({ where: { bookingId } });

    await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    // Notification hôte
    await this.notificationsService.create(
      booking.property.hostId,
      'BOOKING_CANCELLED',
      'Réservation annulée',
      `Une réservation pour ${booking.property.title || 'votre logement'} a été annulée`,
      { bookingId, propertyId: booking.propertyId },
    );

    return { success: true, message: 'Réservation annulée, remboursement en cours' };
  }
}