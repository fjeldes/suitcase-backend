import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['category'])
@Entity('faqs')
export class FAQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ default: 'general' })
  category: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
