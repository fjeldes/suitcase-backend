import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum PayoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Index(['ownerId'])
@Index(['status'])
@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalGross: number;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
