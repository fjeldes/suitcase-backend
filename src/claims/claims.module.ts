import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { Claim } from './entities/claim.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Claim, Booking])],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
