import { IsInt, IsString, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  comment!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}