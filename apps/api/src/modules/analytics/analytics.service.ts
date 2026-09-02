import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Vue d'ensemble pour le dashboard admin
  async getOverview() {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      activeListings,
      pendingBookings,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.property.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.prisma.booking.count(),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.property.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeListings,
      pendingBookings,
    };
  }

  // Revenus par jour (last 30 jours)
  async getRevenueByDay(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: since },
      },
      select: {
        amount: true,
        currency: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    // Grouper par jour
    const grouped: Record<string, number> = {};
    for (const p of payments) {
      if (!p.paidAt) continue;
      const day = p.paidAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + p.amount;
    }

    // Remplir les jours sans paiement avec 0
    const result = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({
        date: key,
        revenue: grouped[key] || 0,
      });
    }

    return result;
  }

  // Top 5 logements les plus réservés
  async getTopProperties(limit: number = 5) {
    const bookings = await this.prisma.booking.groupBy({
      by: ['propertyId'],
      where: { status: { not: 'CANCELLED' } },
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const propertyIds = bookings.map((b) => b.propertyId);

    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, title: true, city: { select: { name: true } } },
    });

    const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

    return bookings.map((b) => ({
      property: propertyMap[b.propertyId],
      bookingCount: b._count.id,
      totalRevenue: b._sum.totalAmount || 0,
    }));
  }

  // Top 5 villes les plus réservées
  async getTopCities(limit: number = 5) {
    const bookings = await this.prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        property: {
          select: {
            city: { select: { name: true, country: { select: { name: true } } } },
          },
        },
      },
    });

    const grouped: Record<string, { name: string; country: string; count: number }> = {};

    for (const b of bookings) {
      const city = b.property?.city;
      if (!city) continue;
      const key = city.name;
      if (!grouped[key]) {
        grouped[key] = { name: city.name, country: city.country.name, count: 0 };
      }
      grouped[key].count++;
    }

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Répartition des statuts de réservations
  async getBookingStatusBreakdown() {
    const statuses = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return statuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));
  }

  // Taux d'occupation par logement (pour un hôte)
  async getPropertyOccupancy(propertyId: string, months: number = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, createdAt: true },
    });

    if (!property) return null;

    // Jours depuis la création du logement (max = months)
    const startDate = property.createdAt > since ? property.createdAt : since;
    const totalDays = Math.max(
      1,
      Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // Jours réservés
    const bookedDays = await this.prisma.propertyAvailability.aggregate({
      where: {
        propertyId,
        status: 'BOOKED',
        date: { gte: startDate },
      },
      _count: { id: true },
    });

    return {
      propertyId: property.id,
      totalDays,
      bookedDays: bookedDays._count.id,
      occupancyRate: Math.round((bookedDays._count.id / totalDays) * 100),
      period: `${months} mois`,
    };
  }

  // Nouveaux utilisateurs par jour (last 30 jours)
  async getNewUsersByDay(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: since },
        deletedAt: null,
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const u of users) {
      const day = u.createdAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + 1;
    }

    const result = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({
        date: key,
        newUsers: grouped[key] || 0,
      });
    }

    return result;
  }
}