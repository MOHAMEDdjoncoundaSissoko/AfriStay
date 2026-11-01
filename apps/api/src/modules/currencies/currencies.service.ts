import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// API gratuite sans clé, qui couvre toutes les devises africaines (XOF, XAF, MAD, DZD...).
// Frankfurter (utilisée avant) ne couvre que les devises de la BCE : pas de XOF, NGN, GHS, KES...
export const RATES_API_URL = 'https://open.er-api.com/v6/latest/XOF';

// Les taux ne sont rafraîchis qu'une fois toutes les 6 h au maximum
// (l'API se met à jour une fois par jour, inutile de l'appeler à chaque requête).
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class CurrenciesService {
  private lastFetch = 0;

  constructor(private prisma: PrismaService) {}

  async fetchRates() {
    if (Date.now() - this.lastFetch < REFRESH_INTERVAL_MS) return;

    try {
      const res = await fetch(RATES_API_URL);
      const data = await res.json();

      if (data.result !== 'success' || !data.rates) return;

      const currencies = await this.prisma.currency.findMany({
        where: { isActive: true },
        select: { code: true },
      });

      // L'API renvoie « 1 XOF = x devise ». En base, rateToXof = « 1 devise = y XOF », donc y = 1 / x.
      const updates = currencies
        .filter((c) => c.code !== 'XOF' && data.rates[c.code] > 0)
        .map((c) =>
          this.prisma.currency.updateMany({
            where: { code: c.code, isActive: true },
            data: { rateToXof: 1 / data.rates[c.code] },
          }),
        );

      await this.prisma.$transaction(updates);
      this.lastFetch = Date.now();
    } catch {
      // Si l'API est indisponible, on garde les taux existants
    }
  }

  async findAll() {
    await this.fetchRates();
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      select: {
        code: true,
        name: true,
        symbol: true,
        flagEmoji: true,
        region: true,
        rateToXof: true,
      },
    });
  }
}