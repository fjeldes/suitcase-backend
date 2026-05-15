// src/transactions/entities/transaction.entity.ts

import { Booking } from "src/bookings/entities/booking.entity";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TransactionStatus {
    PENDING = 'pending',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export enum PaymentMethod {
    STRIPE = 'stripe',
    CASH = 'cash',
    APP_CREDIT = 'app_credit',
}

export enum TransactionType {
    BOOKING = 'booking',
    EXTENSION = 'extension',
}

@Index(['status'])
@Index(['bookingId'])
@Index(['createdAt'])
@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    bookingId: string;

    @ManyToOne(() => Booking, (booking) => booking.transactions)
    booking: Booking;

    @Column({ type: 'enum', enum: TransactionType, default: TransactionType.BOOKING })
    type: TransactionType;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    taxAmount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    serviceFee: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    ownerNet: number;

    @Column({ type: 'varchar', length: 3, default: 'CLP' })
    currency: string;

    @Column({ type: 'enum', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus;

    @Column({ nullable: true })
    providerTransactionId: string;

    @Column({ nullable: true })
    receiptUrl: string;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}