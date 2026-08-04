import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReplyReviewDto } from './dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('property/:propertyId')
  async getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @Get('can-review/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async canReview(@Param('propertyId') propertyId: string, @Request() req: any) {
    const can = await this.reviewsService.canUserReview(req.user.id, propertyId);
    return { canReview: can };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, dto);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async replyToReview(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(id, req.user.id, dto);
  }
}