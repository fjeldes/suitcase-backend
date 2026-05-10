import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Relación con el usuario que hace la reseña
  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  // Relación con el local reseñado
  @ManyToOne(() => Location, (location) => location.reviews)
  location: Location;

  // Relación con la reserva específica (para verificar que es real)
  @ManyToOne(() => Booking, (booking) => booking.review)
  booking: Booking;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
