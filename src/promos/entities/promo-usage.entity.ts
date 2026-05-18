import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Promo } from './promo.entity';

@Index(['promoId', 'userId'], { unique: true })
@Entity('promo_usages')
export class PromoUsage extends BaseEntity {
  @Column()
  promoId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Promo, { onDelete: 'CASCADE' })
  promo: Promo;
}
