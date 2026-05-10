import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationCategory {
    TRANSACTIONAL = 'TRANSACTIONAL',
    MARKETING = 'MARKETING',
    SYSTEM = 'SYSTEM',
    BOOKINGS = 'BOOKINGS',
}

@Entity({ name: 'notifications' })
@Index(['userId', 'isRead']) // CRÍTICO: Para el contador de pendientes (Badge)
@Index(['userId', 'createdAt']) // Para la lista del Inbox
export class Notification extends BaseEntity {

    @Column()
    title: string;

    @Column()
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({
        type: 'enum',
        enum: NotificationCategory,
        default: NotificationCategory.TRANSACTIONAL,
    })
    category: NotificationCategory;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    @Index() // Para que el CRON de limpieza sea ultra rápido
    expiresAt?: Date;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}