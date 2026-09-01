import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CinetPayWebhookDto {
  @IsString()
  transaction_id!: string;

  @IsString()
  payment_method!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  status!: string;

  @IsString()
  signature!: string;

  @IsString()
  @IsOptional()
  booking_id?: string;

  @IsString()
  @IsOptional()
  metadata?: string;
}