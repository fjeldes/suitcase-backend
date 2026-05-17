import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('promos')
export class Promo extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 20, default: 'percentage' })
  discountType: 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'int', default: 1 })
  maxUses: number;

  @Column({ type: 'int', default: 0 })
  currentUses: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  minBookingAmount: number | null;
}
