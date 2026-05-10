import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityLogType } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Crea un nuevo registro de actividad genérico
   */
  private async createLog(ownerId: string, type: ActivityLogType, payload: Record<string, any>, locationId?: string) {
    try {
      const log = this.activityLogRepository.create({
        owner: { id: ownerId },
        location: locationId ? { id: locationId } : undefined,
        type,
        payload,
      });
      await this.activityLogRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to create activity log', error);
    }
  }

  // Helpers específicos para mantener el código limpio en otros servicios

  async logNewBooking(ownerId: string, locationId: string, itemsSummary: string, status: string, time: string) {
    await this.createLog(ownerId, ActivityLogType.NEW_BOOKING, {
      itemsSummary,
      status,
      time,
    }, locationId);
  }

  async logCollectionCompleted(ownerId: string, locationId: string, orderNumber: string, time: string) {
    await this.createLog(ownerId, ActivityLogType.COLLECTION_COMPLETED, {
      orderNumber,
      time,
    }, locationId);
  }

  async logBookingCancelled(ownerId: string, locationId: string, orderNumber: string) {
    await this.createLog(ownerId, ActivityLogType.BOOKING_CANCELLED, {
      orderNumber,
      status: 'Cancelled',
    }, locationId);
  }

  async logReviewReceived(ownerId: string, locationId: string, rating: number) {
    await this.createLog(ownerId, ActivityLogType.REVIEW_RECEIVED, {
      rating,
      time: 'Just now',
    }, locationId);
  }

  /**
   * Obtiene el historial reciente para el dashboard del owner
   */
  async getOwnerRecentActivity(ownerId: string, limit = 10) {
    return this.activityLogRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['location'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
