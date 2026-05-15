import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ErrorLogSource {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
}

@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ErrorLogSource, default: ErrorLogSource.BACKEND })
  source: ErrorLogSource;

  @Column()
  @Index()
  level: string;

  @Column()
  message: string;

  @Column({ type: 'text', nullable: true })
  stack?: string;

  @Column({ nullable: true })
  method?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, any>;

  @Column({ nullable: true })
  userEmail?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
