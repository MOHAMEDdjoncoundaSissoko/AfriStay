import { IsArray, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(['TRAVELER', 'HOST', 'ADMIN'], { each: true })
  roles!: string[];
}

export class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status!: string;
}

export class UpdatePropertyStatusDto {
  @IsIn(['PUBLISHED', 'DRAFT', 'ARCHIVED'])
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReviewVerificationDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}