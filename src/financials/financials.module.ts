import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Payout } from 'src/payouts/entities/payout.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Payout, Booking])],
  controllers: [FinancialsController],
  providers: [FinancialsService],
})
export class FinancialsModule {}
