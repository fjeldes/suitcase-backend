import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction, TransactionStatus } from 'src/transactions/entities/transaction.entity';
import { Payout, PayoutStatus } from 'src/payouts/entities/payout.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    @InjectRepository(Payout)
    private payoutRepo: Repository<Payout>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async getSummary() {
    const allTx = await this.txRepo.find({ where: { status: TransactionStatus.SUCCEEDED } });
    const totalRevenue = allTx.reduce((s, t) => s + Number(t.totalAmount), 0);
    const platformFees = allTx.reduce((s, t) => s + Number(t.serviceFee), 0);

    const pendingPayouts = await this.payoutRepo.find({ where: { status: PayoutStatus.PENDING } });
    const pendingTotal = pendingPayouts.reduce((s, p) => s + Number(p.totalGross), 0);

    const activeBookings = await this.bookingRepo.find({ where: { status: 'in_storage' } });
    const activeSubscriptions = await this.bookingRepo.find({ where: { status: 'confirmed' } });

    return {
      totalRevenue: Math.round(totalRevenue),
      totalRevenueChange: '+12.5%',
      pendingPayouts: pendingTotal,
      pendingPayoutsCount: pendingPayouts.length,
      activeSubscriptions: activeSubscriptions.length + activeBookings.length,
      subscriptionsChange: '+84',
      platformFees: Math.round(platformFees),
      platformFeesPeriod: 'FY',
    };
  }

  async getRevenueTrend() {
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('en-US', { month: 'short' });

      const txs = await this.txRepo.find({
        where: {
          status: TransactionStatus.SUCCEEDED,
          createdAt: Between(start, end),
        },
      });
      const value = txs.reduce((s, t) => s + Number(t.totalAmount), 0);
      months.push({ label, value: Math.round(value / 1000) });
    }
    return months;
  }

  async getTransactions(page: number = 1, limit: number = 15) {
    const [data, total] = await this.txRepo.findAndCount({
      relations: ['booking', 'booking.location'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = data.map((t) => ({
      id: t.id,
      transactionId: `#TRX-${t.id.slice(0, 6).toUpperCase()}`,
      store: t.booking?.location?.name || 'Unknown',
      amount: Number(t.totalAmount),
      fee: Number(t.serviceFee),
      status: t.status,
      date: t.createdAt,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
