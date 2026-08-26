import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

// --- Mocks ---

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

// --- Tests ---

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ========================
  // REGISTER
  // ========================

  describe('register', () => {
    const registerDto = {
      firstName: 'Moussa',
      lastName: 'Diallo',
      email: 'moussa@test.com',
      password: 'MotDePasse123',
    };

    it('doit créer un utilisateur avec le rôle TRAVELER et retourner les tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'moussa@test.com',
        firstName: 'Moussa',
        lastName: 'Diallo',
        phone: null,
        roles: ['TRAVELER'],
        avatarUrl: null,
        isVerified: false,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      // Vérifie que le mot de passe est hashé (pas stocké en clair)
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'moussa@test.com',
            roles: ['TRAVELER'],
            passwordHash: expect.any(String),
          }),
        }),
      );
      // Le passwordHash ne doit PAS être le mot de passe en clair
      const callData = mockPrismaService.user.create.mock.calls[0][0].data;
      expect(callData.passwordHash).not.toBe('MotDePasse123');
      expect(callData.passwordHash.length).toBeGreaterThan(0);

      // Vérifie la réponse
      expect(result.user.email).toBe('moussa@test.com');
      expect(result.user.roles).toEqual(['TRAVELER']);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');

      // Vérifie que le refresh token est stocké
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            token: 'refresh-token',
          }),
        }),
      );
    });

    it('doit rejeter un email déjà utilisé (409)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'moussa@test.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('doit stocker le phone si fourni', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'moussa@test.com',
        firstName: 'Moussa',
        lastName: 'Diallo',
        phone: '+2250707070707',
        roles: ['TRAVELER'],
        avatarUrl: null,
        isVerified: false,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        ...registerDto,
        phone: '+2250707070707',
      });

      expect(result.user.phone).toBe('+2250707070707');
      const callData = mockPrismaService.user.create.mock.calls[0][0].data;
      expect(callData.phone).toBe('+2250707070707');
    });
  });

  // ========================
  // LOGIN
  // ========================

  describe('login', () => {
    const loginDto = {
      email: 'moussa@test.com',
      password: 'MotDePasse123',
    };

    it('doit retourner les tokens pour des identifiants valides', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'moussa@test.com',
        firstName: 'Moussa',
        lastName: 'Diallo',
        phone: null,
        roles: ['TRAVELER'],
        avatarUrl: null,
        isVerified: false,
        isActive: true,
        passwordHash: '$2b$12$hashedpassword', // on mockera bcrypt.compare
      });
      // On mock bcrypt via spy sur le module
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('moussa@test.com');
      expect(result.user.roles).toEqual(['TRAVELER']);
      // Le passwordHash ne doit PAS être dans la réponse
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('doit rejeter un email inexistant (401)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('doit rejeter un mot de passe incorrect (401)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'moussa@test.com',
        isActive: true,
        passwordHash: '$2b$12$hashedpassword',
      });
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('doit rejeter un utilisateur désactivé (401)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'moussa@test.com',
        isActive: false,
        passwordHash: '$2b$12$hashedpassword',
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  // ========================
  // REFRESH
  // ========================

  describe('refresh', () => {
    it('doit retourner un nouveau pair de tokens si le refresh token est valide', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 86400000), // dans 1 jour
        user: {
          id: 'user-1',
          email: 'moussa@test.com',
          roles: ['TRAVELER'],
        },
      });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh({ refreshToken: 'old-refresh-token' });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      // L'ancien token doit être supprimé (rotation)
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
    });

    it('doit rejeter un refresh token inexistant (401)', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('doit rejeter un refresh token expiré et le supprimer (401)', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // hier
        user: { id: 'user-1', email: 'test@test.com', roles: ['TRAVELER'] },
      });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(
        service.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);
      // Le token expiré doit être nettoyé
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-expired' },
      });
    });
  });

  // ========================
  // LOGOUT
  // ========================

  describe('logout', () => {
    it('doit supprimer le refresh token spécifié', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('user-1', 'my-refresh-token');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', token: 'my-refresh-token' },
      });
    });
  });

  // ========================
  // LOGOUT ALL
  // ========================

  describe('logoutAll', () => {
    it('doit supprimer tous les refresh tokens de l\'utilisateur', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.logoutAll('user-1');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});