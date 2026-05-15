import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('generate')
  async generate(@Body() body: { year: number; month: number }) {
    return this.payoutsService.generateMonthlyPayouts(body.year, body.month);
  }

  @Get('pending')
  async pending() {
    return this.payoutsService.getPendingPayouts();
  }

  @Post(':id/mark-paid')
  async markPaid(@Param('id') id: string, @Body() body: { paymentReference: string; notes?: string }) {
    return this.payoutsService.markAsPaid(id, body.paymentReference, body.notes);
  }

  @Get('history')
  async history() {
    return this.payoutsService.getPayoutHistory();
  }
}
