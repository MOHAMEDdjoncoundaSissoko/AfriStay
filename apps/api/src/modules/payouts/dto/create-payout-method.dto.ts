import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayoutMethodDto {
  @ApiProperty({ example: 'WAVE', enum: ['ORANGE_MONEY', 'WAVE', 'MTN_MOMO', 'BANK_TRANSFER'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO', 'BANK_TRANSFER'])
  type!: string;

  @ApiPropertyOptional({ example: '+2250707070707' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Aminata Koné' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountName?: string;

  @ApiPropertyOptional({ example: 'BICICI' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'CI12345678' })
  @IsOptional()
  @IsString()
  rib?: string;
}