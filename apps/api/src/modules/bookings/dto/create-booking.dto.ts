import { IsString, IsNotEmpty, IsInt, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'cms02cgp2000142rya33osus2' })
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  checkInDate!: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  checkOutDate!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  numberOfGuests!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}