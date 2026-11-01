import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyContactDto {
  @IsString()
  @IsNotEmpty()
  reply!: string;
}