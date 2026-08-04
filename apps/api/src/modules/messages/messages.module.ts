import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  imports: [NotificationsModule],
})
export class MessagesModule {}