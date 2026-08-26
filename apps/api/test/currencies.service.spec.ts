import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesService } from '../src/modules/currencies/currencies.service';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock du fetch global
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

const mockPrismaService = {
  currency: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
    jest.clearAllMocks();
  });

  // ========================
  // FETCH RATES
  // ========================

  describe('fetchRates', () => {
    it('doit mettre à jour les taux depuis l\'API Frankfurter', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          rates: {
            NGN: 1.57,
            GHS: 0.0097,
            KES: 0.085,
            ZAR: 0.024,
            USD: 0.00061,
            EUR: 0.00056,
          },
        }),
      });
      mockPrismaService.currency.updateMany.mockResolvedValue({ count: 1 });

      await service.fetchRates();

      // 6 devises mises à jour
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledTimes(6);
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledWith({
        where: { code: 'NGN', isActive: true },
        data: { rateToXof: 1.57 },
      });
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledWith({
        where: { code: 'USD', isActive: true },
        data: { rateToXof: 0.00061 },
      });
    });

    it('doit ignorer si l\'API ne retourne pas de rates', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({}),
      });

      await service.fetchRates();

      expect(mockPrismaService.currency.updateMany).not.toHaveBeenCalled();
    });

    it('doit ignorer si l\'API est indisponible (catch silencieux)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await service.fetchRates();

      expect(mockPrismaService.currency.updateMany).not.toHaveBeenCalled();
    });
  });

  // ========================
  // FIND ALL
  // ========================

  describe('findAll', () => {
    it('doit retourner les devises actives triées par code', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ rates: {} }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([
        { code: 'EUR', name: 'Euro', symbol: '€', flagEmoji: '🇪🇺', rateToXof: 0.00056 },
        { code: 'GHS', name: 'Cedi', symbol: '₵', flagEmoji: '🇬🇭', rateToXof: 0.0097 },
        { code: 'NGN', name: 'Naira', symbol: '₦', flagEmoji: '🇳🇬', rateToXof: 1.57 },
        { code: 'USD', name: 'Dollar', symbol: '$', flagEmoji: '🇺🇸', rateToXof: 0.00061 },
        { code: 'XOF', name: 'Franc CFA', symbol: 'F', flagEmoji: '🇨🇮', rateToXof: 1 },
        { code: 'ZAR', name: 'Rand', symbol: 'R', flagEmoji: '🇿🇦', rateToXof: 0.024 },
        { code: 'KES', name: 'Shilling', symbol: 'KSh', flagEmoji: '🇰🇪', rateToXof: 0.085 },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(7);
      const call = mockPrismaService.currency.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
      expect(call.orderBy).toEqual({ code: 'asc' });
      // Seuls les champs nécessaires
      expect(call.select.code).toBe(true);
      expect(call.select.name).toBe(true);
      expect(call.select.symbol).toBe(true);
      expect(call.select.flagEmoji).toBe(true);
      expect(call.select.rateToXof).toBe(true);
    });

    it('doit appeler fetchRates avant de retourner', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ rates: {} }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.frankfurter.app/latest?from=XOF',
      );
    });
  });
});