import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UpdatePropertyStatusDto,
  ReviewVerificationDto,
  AdminQueryDto,
} from './dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /* ─── DASHBOARD ─── */

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalProperties,
      totalBookings,
      revenueResult,
      recentUsers,
      recentBookings,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
        _sum: { commissionAmount: true },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, email: true, roles: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          traveler: { select: { firstName: true, lastName: true } },
          property: { select: { title: true } },
        } as any,
      }),
      this.prisma.userVerification.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalProperties,
      totalBookings,
      monthlyRevenue: revenueResult._sum.commissionAmount || 0,
      recentUsers,
      recentBookings,
      pendingVerifications,
    };
  }

  /* ─── UTILISATEURS ─── */

  async getUsers(query: AdminQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'DISABLED') {
      where.isActive = false;
    } else if (query.status === 'ACTIVE') {
      where.isActive = true;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          _count: { select: { properties: true, bookings: true } },
        },
      }) as any,
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: dto.roles as any },
      select: { id: true, firstName: true, lastName: true, email: true, roles: true },
    });

    await this.logAction(adminId, 'UPDATE_USER_ROLE', 'USER', userId, { oldRoles: user.roles, newRoles: dto.roles });
    return updated;
  }

  async toggleUserStatus(userId: string, dto: UpdateUserStatusDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.status === 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });

    await this.logAction(adminId, 'TOGGLE_USER_STATUS', 'USER', userId, { newStatus: dto.status });
    return updated;
  }

  /* ─── LOGEMENTS ─── */

  async getProperties(query: AdminQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isCover: true }, take: 1 },
          host: { select: { firstName: true, lastName: true, email: true } },
          city: { select: { name: true } },
          country: { select: { name: true } },
          _count: { select: { bookings: true, reviews: true } },
        } as any,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePropertyStatus(propertyId: string, dto: UpdatePropertyStatusDto, adminId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Logement introuvable');

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: dto.status as any },
    });

    await this.logAction(adminId, 'UPDATE_PROPERTY_STATUS', 'PROPERTY', propertyId, { oldStatus: property.status, newStatus: dto.status, reason: dto.reason });
    return updated;
  }

  /* ─── VÉRIFICATIONS ─── */

  async getVerifications(query: AdminQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [verifications, total] = await Promise.all([
      this.prisma.userVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
        },
      }),
      this.prisma.userVerification.count({ where }),
    ]);

    return {
      data: verifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewVerification(verificationId: string, dto: ReviewVerificationDto, adminId: string) {
    const verification = await this.prisma.userVerification.findUnique({ where: { id: verificationId } });
    if (!verification) throw new NotFoundException('Vérification introuvable');

    const updated = await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: { status: dto.status as any, rejectReason: dto.reason || null, reviewedAt: new Date() },
      include: { user: { select: { id: true, isVerified: true } } },
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: verification.userId }, data: { isVerified: true } });
    }

    await this.logAction(adminId, 'REVIEW_VERIFICATION', 'VERIFICATION', verificationId, { status: dto.status, reason: dto.reason, userId: verification.userId });
    return updated;
  }

  /* ─── LOG ─── */

  private async logAction(adminId: string, action: string, entityType: string, entityId: string, details: any) {
    try {
      await this.prisma.adminLog.create({
        data: {
          action,
          entityType,
          entityId,
          details: JSON.parse(JSON.stringify({ ...details })),
          admin: { connect: { id: adminId } },
        },
      } as any);
    } catch {
      // Le log ne doit pas casser l'action
    }
  }
}