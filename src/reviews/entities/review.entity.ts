import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Index(['locationId'])
@Index(['bookingId'])
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column()
  userId: string;

  @Column()
  locationId: string;

  @Column()
  bookingId: string;

  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @ManyToOne(() => Location, (location) => location.reviews)
  location: Location;

  @ManyToOne(() => Booking, (booking) => booking.review)
  booking: Booking;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
