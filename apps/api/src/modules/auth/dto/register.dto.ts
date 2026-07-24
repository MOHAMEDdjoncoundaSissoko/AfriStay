import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Aminata' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Koné' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'aminata@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+2250707070707' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'MonMotDePasse123' })
  @IsString()
  @MinLength(8)
  password!: string;
}