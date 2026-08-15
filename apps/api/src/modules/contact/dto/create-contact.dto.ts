import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  firstName!: string;
  lastName!: string;
  email!: string;
  subject!: string;
  message!: string;
  userId?: string;
}