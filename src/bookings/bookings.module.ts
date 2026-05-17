import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from 'src/locations/entities/location.entity';
import { LocationOwner } from 'src/locations/entities/location-owner.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import { User } from 'src/users/entities/user.entity';
import { PaymentsModule } from 'src/payments/payments.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { PromosModule } from 'src/promos/promos.module';

@Module({
  imports: [TypeOrmModule.forFeature([
    Booking, Location, LocationOwner, User]),
    NotificationsModule,
    PaymentsModule,
    ActivityLogsModule,
    TransactionsModule,
    PromosModule
  ],
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule { }
