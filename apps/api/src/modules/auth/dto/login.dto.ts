import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'aminata@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MonMotDePasse123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}