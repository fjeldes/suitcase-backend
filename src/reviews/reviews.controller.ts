import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto, @GetUser('id') userId: string) {
    return this.reviewsService.create(dto, userId);
  }

  @Get('eligible')
  @UseGuards(JwtAuthGuard)
  async getEligible(@GetUser('id') userId: string) {
    const eligibleReviews = await this.reviewsService.findEligibleBookings(userId);
    return { eligible: eligibleReviews.length > 0, bookings: eligibleReviews };
  }

  @Get('location/:locationId')
  findByLocation(@Param('locationId') locationId: string) {
    return this.reviewsService.findByLocation(locationId);
  }

  @Get('location/:locationId/average')
  getAverage(@Param('locationId') locationId: string) {
    return this.reviewsService.getAverageRating(locationId);
  }
}
