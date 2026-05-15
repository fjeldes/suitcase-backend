import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { FinancialsService } from './financials.service';

@Controller('financials')
export class FinancialsController {
  constructor(private readonly service: FinancialsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @UseGuards(JwtAuthGuard)
  @Get('revenue')
  getRevenueTrend() {
    return this.service.getRevenueTrend();
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTransactions(Number(page) || 1, Number(limit) || 15);
  }
}
