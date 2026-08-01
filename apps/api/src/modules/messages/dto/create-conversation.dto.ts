import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}