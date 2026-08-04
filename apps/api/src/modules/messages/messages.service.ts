import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    // 1. Vérifier que le logement existe et récupérer l'hôte
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: { id: true, hostId: true, title: true },
    });

    if (!property) throw new NotFoundException('Logement non trouvé');
    if (property.hostId === userId) throw new ForbiddenException('Vous ne pouvez pas vous envoyer un message à vous-même');

    // 2. Vérifier si une conversation existe déjà pour ce logement entre ces 2 users
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        propertyId: property.id,
        participants: {
          every: { userId: { in: [userId, property.hostId] } }
        }
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        property: { select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } } }
      }
    });

    // 3. Si pas de conversation, on la crée
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          propertyId: property.id,
          participants: {
            create: [
              { userId: userId },
              { userId: property.hostId }
            ]
          }
        },
        include: {
          participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
          property: { select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } } }
        }
      });
    }

    // 4. Envoyer le premier message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: dto.message,
      }
    });

    // 5. Mettre à jour lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    });

    return { conversation, message };
  }

  async getMyConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        property: { select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } } },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Formater pour renvoyer seulement l'autre utilisateur et le dernier message
    return conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId);
      const lastMessage = conv.messages[0];
      return {
        id: conv.id,
        property: conv.property,
        otherUser: otherParticipant?.user,
        lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt } : null
      };
    });
  }

  async getMessages(userId: string, conversationId: string) {
    // Vérifier que l'utilisateur est participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    if (!participant) throw new ForbiddenException('Accès interdit à cette conversation');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    if (!participant) throw new ForbiddenException('Accès interdit');

    // Trouver l'autre participant pour la notification
    const otherParticipant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: { not: userId },
      },
      include: { user: { select: { id: true, firstName: true } } },
    });

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Notification pour l'autre participant
    if (otherParticipant) {
      await this.notificationsService.create(
        otherParticipant.userId,
        'NEW_MESSAGE',
        'Nouveau message',
        `${message.sender.firstName} : ${dto.content.substring(0, 80)}${dto.content.length > 80 ? '...' : ''}`,
        { conversationId },
      );
    }

    return message;
  }
}