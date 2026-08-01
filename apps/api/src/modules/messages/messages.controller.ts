import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(req.user.id, dto);
  }

  @Get('conversations')
  getMyConversations(@Request() req: any) {
    return this.messagesService.getMyConversations(req.user.id);
  }

  @Get('conversations/:id')
  getMessages(@Request() req: any, @Param('id') id: string) {
    return this.messagesService.getMessages(req.user.id, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Request() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.id, id, dto);
  }
}