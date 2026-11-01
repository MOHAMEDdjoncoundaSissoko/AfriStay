import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesService, RATES_API_URL } from '../src/modules/currencies/currencies.service';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock du fetch global
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

const mockPrismaService = {
  currency: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
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
    mockPrismaService.currency.updateMany.mockImplementation((args) => args);
    mockPrismaService.$transaction.mockResolvedValue([]);
  });

  // ========================
  // FETCH RATES
  // ========================

  describe('fetchRates', () => {
    it('doit mettre à jour toutes les devises actives, en inversant le taux (1 devise = x XOF)', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          result: 'success',
          rates: { XOF: 1, MAD: 0.016, XAF: 1, EUR: 0.0015245, NGN: 2.5 },
        }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([
        { code: 'XOF' }, { code: 'MAD' }, { code: 'XAF' }, { code: 'EUR' }, { code: 'NGN' },
      ]);

      await service.fetchRates();

      expect(mockFetch).toHaveBeenCalledWith(RATES_API_URL);
      // XOF est la devise de référence : pas mise à jour
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledWith({
        where: { code: 'MAD', isActive: true },
        data: { rateToXof: 1 / 0.016 },
      });
      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledWith({
        where: { code: 'NGN', isActive: true },
        data: { rateToXof: 0.4 },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('doit ignorer une devise absente de la réponse de l\'API', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: 'success', rates: { MAD: 0.016 } }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([{ code: 'MAD' }, { code: 'ZWG' }]);

      await service.fetchRates();

      expect(mockPrismaService.currency.updateMany).toHaveBeenCalledTimes(1);
    });

    it('ne doit pas rappeler l\'API avant 6 h', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: 'success', rates: { MAD: 0.016 } }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([{ code: 'MAD' }]);

      await service.fetchRates();
      await service.fetchRates();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('doit ignorer si l\'API renvoie une erreur', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: 'error', 'error-type': 'unsupported-code' }),
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
    it('doit retourner les devises actives triées par code, avec leur région', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: 'error' }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([
        { code: 'MAD', name: 'Dirham marocain', symbol: 'DH', flagEmoji: '🇲🇦', region: 'AFRIQUE_NORD', rateToXof: 59.74 },
        { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', flagEmoji: '🇨🇲', region: 'AFRIQUE_CENTRALE', rateToXof: 1 },
        { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', flagEmoji: '🇨🇮', region: 'AFRIQUE_OUEST', rateToXof: 1 },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      const call = mockPrismaService.currency.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
      expect(call.orderBy).toEqual({ code: 'asc' });
      expect(call.select).toEqual({
        code: true,
        name: true,
        symbol: true,
        flagEmoji: true,
        region: true,
        rateToXof: true,
      });
    });

    it('doit appeler fetchRates avant de retourner', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: 'error' }),
      });
      mockPrismaService.currency.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockFetch).toHaveBeenCalledWith(RATES_API_URL);
    });
  });
});