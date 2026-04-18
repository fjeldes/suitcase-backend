import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationOwner } from './entities/location-owner.entity';
import { Location } from './entities/location.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Location,
    LocationOwner,
    User,
    Booking])],
  providers: [LocationsService],
  controllers: [LocationsController]
})
export class LocationsModule { }
