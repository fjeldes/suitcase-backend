import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Payout, PayoutStatus } from './entities/payout.entity';
import { PayoutItem } from './entities/payout-item.entity';
import { Transaction, TransactionStatus } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(PayoutItem)
    private readonly payoutItemRepo: Repository<PayoutItem>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async generateMonthlyPayouts(year: number, month: number): Promise<Payout[]> {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const existing = await this.payoutRepo.count({ where: { periodStart: start, periodEnd: end } });
    if (existing > 0) {
      this.logger.log(`Payouts for ${year}-${month} already generated`);
      return [];
    }

    const owners = await this.userRepo.find({ relations: ['roles', 'roles.role'] });
    const ownerUsers = owners.filter(u => u.roles?.some((r: any) => (r.role?.name || r) === 'owner'));

    const payouts: Payout[] = [];

    for (const owner of ownerUsers) {
      const transactions = await this.transactionRepo.find({
        where: {
          status: TransactionStatus.SUCCEEDED,
          createdAt: Between(start, end),
        },
        relations: ['booking', 'booking.location', 'booking.location.owners'],
      });

      const ownerTransactions = transactions.filter((tx: any) =>
        tx.booking?.location?.owners?.some((o: any) => o.user?.id === owner.id),
      );

      if (ownerTransactions.length === 0) continue;

      const totalGross = ownerTransactions.reduce((sum, tx) => sum + Number(tx.ownerNet), 0);

      const payout = await this.payoutRepo.save({
        ownerId: owner.id,
        periodStart: start,
        periodEnd: end,
        totalGross,
        status: PayoutStatus.PENDING,
      });

      await this.payoutItemRepo.save(
        ownerTransactions.map((tx) => ({
          payout: { id: payout.id },
          transactionId: tx.id,
          ownerNetAmount: Number(tx.ownerNet),
        })),
      );

      payouts.push(payout);
      this.logger.log(`Payout created for owner ${owner.email}: $${totalGross}`);
    }

    return payouts;
  }

  async getPendingPayouts(): Promise<Payout[]> {
    return this.payoutRepo.find({ where: { status: PayoutStatus.PENDING }, order: { createdAt: 'DESC' } });
  }

  async markAsPaid(id: string, paymentReference: string, notes?: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({ where: { id: id as any } });
    if (!payout) throw new Error('Payout not found');
    payout.status = PayoutStatus.PAID;
    payout.paidAt = new Date();
    payout.paymentReference = paymentReference;
    if (notes) payout.notes = notes;
    return this.payoutRepo.save(payout);
  }

  async getPayoutHistory(): Promise<Payout[]> {
    return this.payoutRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
  }
}
