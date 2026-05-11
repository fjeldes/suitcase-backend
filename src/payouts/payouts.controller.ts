import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Body() body: { year: number; month: number }) {
    return this.payoutsService.generateMonthlyPayouts(body.year, body.month);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  async pending() {
    return this.payoutsService.getPendingPayouts();
  }

  @Post(':id/mark-paid')
  @UseGuards(JwtAuthGuard)
  async markPaid(@Param('id') id: string, @Body() body: { paymentReference: string; notes?: string }) {
    return this.payoutsService.markAsPaid(id, body.paymentReference, body.notes);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async history() {
    return this.payoutsService.getPayoutHistory();
  }
}
