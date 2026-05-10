import { BaseEntity } from 'src/common/entities/base.entity';
import { Location } from 'src/locations/entities/location.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum ActivityLogType {
  NEW_BOOKING = 'NEW_BOOKING',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  COLLECTION_COMPLETED = 'COLLECTION_COMPLETED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
}

@Entity({ name: 'activity_logs' })
@Index(['owner', 'createdAt']) // Acelera el Feed cronológico por Owner
export class ActivityLog extends BaseEntity {
  @Column()
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ nullable: true })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @Column({ type: 'enum', enum: ActivityLogType })
  @Index() // Para filtrar por tipo de evento rápidamente
  type: ActivityLogType;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any>;
}