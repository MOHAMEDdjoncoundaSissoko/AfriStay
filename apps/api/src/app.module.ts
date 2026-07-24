import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Charge les variables d'environnement (.env)
    ConfigModule.forRoot({ isGlobal: true }),
    // Connexion à la base de données
    PrismaModule,
    // Endpoint de test
    HealthModule,
  ],
})
export class AppModule {}