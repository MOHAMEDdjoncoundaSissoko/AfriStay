import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ReplyContactDto } from './dto/reply-contact.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Ouvert à tous (visiteurs compris). Si l'utilisateur est connecté,
  // on rattache le message à SON compte, en lisant son id dans le token.
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.contactService.create(dto, req.user?.id ?? null);
  }

  // Un utilisateur connecté voit uniquement SES demandes
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(@Request() req: any) {
    return this.contactService.findByUser(req.user.id);
  }

  // Admin uniquement : toute la boîte de support
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.contactService.findAll();
  }

  // Admin uniquement : répondre au nom du support
  @Patch(':id/reply')
  @UseGuards(AdminGuard)
  async reply(@Param('id') id: string, @Body() dto: ReplyContactDto) {
    return this.contactService.reply(id, dto.reply);
  }
}