import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TermsType {
  CLIENT = 'client',
  OWNER = 'owner',
  STAFF = 'staff',
  PRIVACY = 'privacy',
}

@Entity('terms')
export class Terms {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TermsType })
  type: TermsType;

  @Column()
  version: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
