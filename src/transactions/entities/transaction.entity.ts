// src/transactions/entities/transaction.entity.ts

import { Booking } from "src/bookings/entities/booking.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Booking, (booking) => booking.transactions)
    booking: Booking;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;      // El total ($10.000)

    @Column('decimal', { precision: 10, scale: 2 })
    taxAmount: number;   // El IVA ($1.597)

    @Column('decimal', { precision: 10, scale: 2 })
    serviceFee: number;  // Tu parte ($1.260)

    @Column('decimal', { precision: 10, scale: 2 })
    ownerNet: number;    // Lo del local ($7.143)

    @Column({ type: 'varchar', length: 3, default: 'CLP' })
    currency: string; // "CLP", "USD", "MXN", etc.

    @Column({ type: 'enum', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus;

    @Column({ nullable: true })
    providerTransactionId: string; // ID de Stripe o el procesador de pagos

    @Column({ nullable: true })
    receiptUrl: string;

    @CreateDateColumn()
    createdAt: Date;
}