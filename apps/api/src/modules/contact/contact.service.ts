import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    return this.prisma.contact.create({ data: dto });
  }

  async findAll(userId?: string) {
    return this.prisma.contact.findMany({ 
      where: userId ? { userId } : undefined, 
      orderBy: { createdAt: 'desc' } 
    });
  }

  async reply(id: string, reply: string) {
    return this.prisma.contact.update({
      where: { id },
      data: { reply },
    });
  }
}