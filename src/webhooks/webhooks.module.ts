import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Transaction])],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
