import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { ActivityLog } from 'src/activity-logs/entities/activity-log.entity';
import { MailModule } from 'src/mail/mail.module';
import { PayoutsModule } from 'src/payouts/payouts.module';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Transaction, Notification, ActivityLog]),
    MailModule,
    PayoutsModule,
  ],
  providers: [TasksService],
})
export class CommonModule {}
