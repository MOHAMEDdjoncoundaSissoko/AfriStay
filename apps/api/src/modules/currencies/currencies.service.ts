import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) {}

  async fetchRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=XOF');
      const data = await res.json();

      if (!data.rates) return;

      const rateMap: Record<string, number> = {
        NGN: data.rates.NGN,
        GHS: data.rates.GHS,
        KES: data.rates.KES,
        ZAR: data.rates.ZAR,
        USD: data.rates.USD,
        EUR: data.rates.EUR,
      };

      for (const [code, rate] of Object.entries(rateMap)) {
        await this.prisma.currency.updateMany({
          where: { code, isActive: true },
          data: { rateToXof: rate },
        });
      }
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
        rateToXof: true,
      },
    });
  }
}