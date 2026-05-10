import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Notification, NotificationCategory } from 'src/notifications/entities/notification.entity';
import { ActivityLog } from 'src/activity-logs/entities/activity-log.entity';
import { subMonths } from 'date-fns';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCleanup() {
        this.logger.log('Iniciando limpieza de registros antiguos...');

        // 1. Limpiar marketing expirado
        const expiredResult = await this.notificationRepo.delete({
            category: NotificationCategory.MARKETING,
            expiresAt: LessThan(new Date()),
        });

        // 2. Limpiar logs de más de 3 meses
        const threeMonthsAgo = subMonths(new Date(), 3);
        const logsResult = await this.activityLogRepo.delete({
            createdAt: LessThan(threeMonthsAgo),
        });

        this.logger.log(`Limpieza terminada: ${expiredResult.affected} notificaciones y ${logsResult.affected} logs eliminados.`);
    }
}