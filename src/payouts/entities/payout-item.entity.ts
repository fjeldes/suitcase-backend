import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Payout } from './payout.entity';

@Entity('payout_items')
export class PayoutItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payout, (payout) => payout.id)
  payout: Payout;

  @Column()
  transactionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  ownerNetAmount: number;
}
