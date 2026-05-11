import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, Between } from 'typeorm';
import { Notification, NotificationCategory } from 'src/notifications/entities/notification.entity';
import { ActivityLog } from 'src/activity-logs/entities/activity-log.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { MailService } from 'src/mail/mail.service';
import { subMonths, subHours } from 'date-fns';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        @InjectRepository(Booking)
        private readonly bookingRepo: Repository<Booking>,
        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,
        private readonly mailService: MailService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCleanup() {
        this.logger.log('Iniciando limpieza de registros antiguos...');

        const expiredResult = await this.notificationRepo.delete({
            category: NotificationCategory.MARKETING,
            expiresAt: LessThan(new Date()),
        });

        const threeMonthsAgo = subMonths(new Date(), 3);
        const logsResult = await this.activityLogRepo.delete({
            createdAt: LessThan(threeMonthsAgo),
        });

        this.logger.log(`Limpieza terminada: ${expiredResult.affected} notificaciones y ${logsResult.affected} logs eliminados.`);
    }

    @Cron(CronExpression.EVERY_HOUR)
    async sendRecentReceipts() {
        this.logger.log('Verificando bookings completados recientemente para enviar recibos...');

        const oneHourAgo = subHours(new Date(), 1);
        const recentBookings = await this.bookingRepo.find({
            where: {
                status: 'completed',
                checkedOutAt: Between(oneHourAgo, new Date()),
            },
            relations: ['user', 'user.profile', 'location', 'transactions'],
        });

        for (const booking of recentBookings) {
            try {
                const email = booking.user?.email;
                const name = booking.user?.profile?.firstName || 'Customer';
                if (!email) continue;

                await this.mailService.sendBookingReceipt(email, name, booking);
                this.logger.log(`Recibo enviado a ${email} para booking ${booking.id}`);
            } catch (err) {
                this.logger.error(`Error enviando recibo para booking ${booking.id}:`, err);
            }
        }
    }
}
