import { IsNumber, IsString, IsObject, IsOptional } from 'class-validator';

export class PaystackEventDto {
  @IsString()
  event!: string;

  @IsObject()
  data!: PaystackDataDto;
}

export class PaystackDataDto {
  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  status!: string;

  @IsString()
  reference!: string;

  @IsOptional()
  metadata?: {
    bookingId?: string;
    [key: string]: unknown;
  };
}