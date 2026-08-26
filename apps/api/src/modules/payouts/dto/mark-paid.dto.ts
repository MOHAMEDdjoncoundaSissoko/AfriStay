import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkPaidDto {
  @ApiPropertyOptional({ example: 'WV-TRANSF-123456' })
  @IsOptional()
  @IsString()
  reference?: string;
}