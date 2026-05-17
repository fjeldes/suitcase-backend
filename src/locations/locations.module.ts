import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationOwner } from './entities/location-owner.entity';
import { Location } from './entities/location.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { User } from 'src/users/entities/user.entity';
import { StaffAssignment } from 'src/staff/entities/staff-assignment.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, LocationOwner, User, Booking, StaffAssignment, Review]),
    NotificationsModule,
  ],
  providers: [LocationsService],
  controllers: [LocationsController]
})
export class LocationsModule { }
