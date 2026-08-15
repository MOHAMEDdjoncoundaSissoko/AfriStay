import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReferencesController } from './modules/properties/references.controller';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    PropertiesModule,
    BookingsModule,
    MessagesModule,
    AdminModule,
    ReviewsModule,
    FavoritesModule,
    NotificationsModule,
    ContactModule,
  ],
  controllers: [ReferencesController], // <-- AJOUTE CETTE LIGNE
})
export class AppModule {}
