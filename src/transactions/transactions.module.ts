// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction])],
    exports: [TypeOrmModule], // Importante para que otros módulos la vean
})
export class TransactionsModule { }