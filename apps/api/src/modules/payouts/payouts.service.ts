import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayoutMethodDto } from './dto/create-payout-method.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  // ========================
  // HÔTE : Moyens de paiement
  // ========================

  async addMethod(hostId: string, dto: CreatePayoutMethodDto) {
    // Validation : téléphone obligatoire pour mobile money
    if (dto.type !== 'BANK_TRANSFER' && !dto.phoneNumber) {
      throw new BadRequestException('Le numéro de téléphone est obligatoire pour ce moyen de paiement');
    }
    // Validation : RIB + nom banque obligatoires pour virement
    if (dto.type === 'BANK_TRANSFER' && (!dto.rib || !dto.bankName)) {
      throw new BadRequestException('Le RIB et le nom de la banque sont obligatoires pour un virement bancaire');
    }

    // Si c'est le seul moyen, le mettre par défaut
    const existingCount = await this.prisma.hostPayoutMethod.count({
      where: { hostId },
    });

    const method = await this.prisma.hostPayoutMethod.create({
      data: {
        hostId,
        type: dto.type,
        phoneNumber: dto.phoneNumber || null,
        accountName: dto.accountName || null,
        bankName: dto.bankName || null,
        rib: dto.rib || null,
        isDefault: existingCount === 0,
      },
    });

    return method;
  }

  async getMethods(hostId: string) {
    return this.prisma.hostPayoutMethod.findMany({
      where: { hostId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setDefault(hostId: string, methodId: string) {
    const method = await this.prisma.hostPayoutMethod.findUnique({
      where: { id: methodId },
    });
    if (!method) throw new NotFoundException('Méthode de paiement introuvable');
    if (method.hostId !== hostId) throw new ForbiddenException('Non autorisé');

    // Retirer le défaut de tous les autres
    await this.prisma.hostPayoutMethod.updateMany({
      where: { hostId, isDefault: true },
      data: { isDefault: false },
    });

    // Mettre celui-ci par défaut
    return this.prisma.hostPayoutMethod.update({
      where: { id: methodId },
      data: { isDefault: true },
    });
  }

  async deleteMethod(hostId: string, methodId: string) {
    const method = await this.prisma.hostPayoutMethod.findUnique({
      where: { id: methodId },
    });
    if (!method) throw new NotFoundException('Méthode de paiement introuvable');
    if (method.hostId !== hostId) throw new ForbiddenException('Non autorisé');

    await this.prisma.hostPayoutMethod.delete({ where: { id: methodId } });

    // Si c'était le défaut, mettre le premier autre par défaut
    if (method.isDefault) {
      const first = await this.prisma.hostPayoutMethod.findFirst({
        where: { hostId },
      });
      if (first) {
        await this.prisma.hostPayoutMethod.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  }

  // ========================
  // ADMIN : Versements
  // ========================

  async getPendingPayouts() {
    return this.prisma.payout.findMany({
      where: { status: 'PENDING' },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, phone: true } },
        booking: {
          select: {
            bookingNumber: true,
            checkInDate: true,
            checkOutDate: true,
            property: { select: { title: true } },
            traveler: { select: { firstName: true, lastName: true } },
          },
        },
        payoutMethod: { select: { type: true, phoneNumber: true, accountName: true, bankName: true, rib: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllPayouts(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.payout.findMany({
      where,
      include: {
        host: { select: { id: true, firstName: true, lastName: true } },
        booking: {
          select: {
            bookingNumber: true,
            property: { select: { title: true } },
          },
        },
        processedByAdmin: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsPaid(payoutId: string, adminId: string, dto: MarkPaidDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException('Versement introuvable');
    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Ce versement n\'est plus en attente');
    }

    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        reference: dto.reference || null,
        paidAt: new Date(),
        processedByAdminId: adminId,
      },
    });
  }

  // ========================
  // AUTO : Création payout quand séjour terminé
  // ========================

  async createPayoutForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { hostId: true, title: true } },
      },
    });

    if (!booking) return;
    if (booking.status !== 'COMPLETED') return;

    // Vérifier si un payout existe déjà
    const existing = await this.prisma.payout.findFirst({
      where: { bookingId },
    });
    if (existing) return;

    // Récupérer le moyen de paiement par défaut de l'hôte
    const defaultMethod = await this.prisma.hostPayoutMethod.findFirst({
      where: { hostId: booking.property.hostId, isDefault: true },
    });

    await this.prisma.payout.create({
      data: {
        bookingId,
        hostId: booking.property.hostId,
        amount: booking.hostPayout,
        currency: booking.currency,
        method: defaultMethod?.type || 'NON_RENSEIGNE',
        payoutMethodId: defaultMethod?.id || null,
        status: 'PENDING',
      },
    });

    // Notification hôte
    // (sera ajoutée quand on branchera NotificationsService)
  }
}