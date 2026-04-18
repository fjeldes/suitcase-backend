import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from 'src/locations/entities/location.entity';
import { LocationOwner } from 'src/locations/entities/location-owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Booking, Location, LocationOwner])],
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule { }
