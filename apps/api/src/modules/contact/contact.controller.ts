import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    return this.contactService.findAll(userId);
  }

  @Patch(':id/reply')
  async reply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.contactService.reply(id, reply);
  }
}