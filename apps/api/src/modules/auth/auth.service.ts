import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Vérifier si l'email existe déjà
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(dto.password, 12);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone || null,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: ['TRAVELER'],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        createdAt: true,
      },
    });

    // Générer les tokens
    const tokens = this.generateTokens(user.id, user.email, user.roles);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const tokens = this.generateTokens(user.id, user.email, user.roles);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  private generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '24h',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; bio?: string; avatarUrl?: string; birthDate?: string; countryOfResidence?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.bio && { bio: data.bio }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
        ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
        ...(data.countryOfResidence && { countryOfResidence: data.countryOfResidence }),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, bio: true, avatarUrl: true, roles: true, isVerified: true, birthDate: true, countryOfResidence: true },
    });
  }

  async submitVerification(userId: string, documentType: string, documentUrl: string) {
    // Supprimer les anciennes demandes en attente
    await this.prisma.userVerification.deleteMany({
      where: { userId, status: 'PENDING' }
    });

    return this.prisma.userVerification.create({
      data: { userId, documentType, documentUrl }
    });
  }
}