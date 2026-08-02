import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Villa de luxe avec piscine à Cocody' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Magnifique villa de 4 chambres avec piscine privée...' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'VILLA' })
  @IsString()
  @IsNotEmpty()
  propertyTypeId!: string;

  @ApiProperty({ example: 'CI' })
  @IsString()
  @IsNotEmpty()
  countryId!: string;

  @ApiProperty({ example: 'abidjan' })
  @IsString()
  @IsNotEmpty()
  cityId!: string;

  @ApiProperty({ example: 'Boulevard de France, Cocody' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 5.36 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -3.9333 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 85000 })
  @IsInt()
  pricePerNight!: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsInt()
  pricePerWeek?: number;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @IsInt()
  pricePerMonth?: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  bedrooms!: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  beds!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  bathrooms!: number;

  @ApiProperty({ example: 350 })
  @IsInt()
  areaSqm!: number;

  @ApiProperty({ example: 8 })
  @IsInt()
  maxGuests!: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  smokingAllowed?: boolean;

  @ApiPropertyOptional({ example: ['wifi', 'ac', 'pool', 'parking'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenitySlugs?: string[];

  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}