import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Location } from 'src/locations/entities/location.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

export enum ClaimStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ClaimPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ClaimType {
  DAMAGE = 'damage',
  LOSS = 'loss',
  THEFT = 'theft',
  OTHER = 'other',
}

@Index(['userId'])
@Index(['status'])
@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn()
  location?: Location;

  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn()
  booking?: Booking;

  @Column({ nullable: true })
  bookingId?: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.OPEN })
  status: ClaimStatus;

  @Column({ type: 'enum', enum: ClaimPriority, default: ClaimPriority.MEDIUM })
  priority: ClaimPriority;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'enum', enum: ClaimType, default: ClaimType.OTHER })
  type: ClaimType;

  @Column({ type: 'json', nullable: true })
  photos?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
