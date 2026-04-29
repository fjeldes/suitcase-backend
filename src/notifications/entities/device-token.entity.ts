import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  provider: string;

  @Column({ nullable: true })
  deviceModel: string;

  // ESTO FALTABA: La columna plana para el ID
  @Column()
  userId: string;

  // La relación propiamente dicha
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' }) // Vincula la columna de arriba con esta relación
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}