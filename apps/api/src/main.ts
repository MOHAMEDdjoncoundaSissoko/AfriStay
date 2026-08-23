import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Préfixe /api pour toutes les routes
  app.setGlobalPrefix('api');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // erreur si champ non déclaré
      transform: true, // transforme les types automatiquement
    }),
  );

  // CORS pour le frontend
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('AfriStay API')
    .setDescription('API de la plateforme de réservation de logements en Afrique de l\'Ouest')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalInterceptors(new RateLimitInterceptor());
  await app.listen(4000);
  console.log('🚀 AfriStay API démarrée sur http://localhost:4000');
  console.log('📖 Documentation Swagger : http://localhost:4000/api/docs');
}
bootstrap();