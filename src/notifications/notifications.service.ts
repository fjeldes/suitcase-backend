import { Injectable, Logger } from '@nestjs/common';
// TODO: Cuando se requiera BullMQ (Redis), descomentar:
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { Notification, NotificationCategory } from './entities/notification.entity';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        // TODO: Descomentar cuando se agregue Redis:
        // @InjectQueue('push-notifications') private readonly notificationQueue: Queue,

        @InjectRepository(DeviceToken)
        private readonly deviceTokenRepository: Repository<DeviceToken>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    private async sendPush(userId: string, title: string, body: string, data?: Record<string, any>) {
        try {
            const tokens = await this.deviceTokenRepository.find({
                where: { user: { id: userId } }
            });
            if (tokens.length === 0) return;

            const messages: ExpoPushMessage[] = [];
            for (const pushToken of tokens) {
                if (!Expo.isExpoPushToken(pushToken.token)) continue;
                messages.push({
                    to: pushToken.token,
                    sound: 'default',
                    title,
                    body,
                    data: data || {},
                });
            }

            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                await expo.sendPushNotificationsAsync(chunk);
            }
        } catch (error) {
            this.logger.error('Error sending push notification:', error);
        }
    }

    async registerToken(userId: string, dto: RegisterTokenDto) {
        const { token, provider, deviceModel } = dto;

        let deviceToken = await this.deviceTokenRepository.findOne({
            where: { token, userId },
        });

        if (deviceToken) {
            deviceToken.updatedAt = new Date();
            return this.deviceTokenRepository.save(deviceToken);
        }

        const newToken = this.deviceTokenRepository.create({ token, provider, deviceModel, userId });
        return this.deviceTokenRepository.save(newToken);
    }

    async notifyBookingCreated(userId: string, bookingId: string) {
        await this.sendPush(userId, '¡Reserva confirmada! ✅', `Tu reserva #${bookingId.substring(0, 8)} ha sido creada con éxito.`);
    }

    async notifyNewBookingForOwner(ownerId: string, bookingId: string) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId: ownerId,
                title: '¡Nueva reserva recibida! 📦',
                message: `Tienes una nueva solicitud de reserva (#${bookingId.substring(0, 8)}) pendiente.`,
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: { bookingId, type: 'NEW_BOOKING' }
            })
        );

        await this.sendPush(ownerId, notification.title, notification.message, { bookingId });
    }

    async findByUser(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async notifyCheckIn(userId: string, bookingId: string, locationName: string) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId,
                title: 'Equipaje recibido ✅',
                message: `Tu equipaje ha sido recibido en ${locationName} (#${bookingId.substring(0, 8)}).`,
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: { bookingId, type: 'CHECK_IN' }
            })
        );
        await this.sendPush(userId, notification.title, notification.message, { bookingId });
    }

    async notifyCheckOut(userId: string, bookingId: string, locationName: string) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId,
                title: 'Equipaje retirado 🎒',
                message: `Tu equipaje ha sido retirado de ${locationName} (#${bookingId.substring(0, 8)}). ¡Gracias por confiar en nosotros!`,
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: { bookingId, type: 'CHECK_OUT' }
            })
        );
        await this.sendPush(userId, notification.title, notification.message, { bookingId });
    }

    async notifyBookingCancelled(ownerId: string, bookingId: string) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId: ownerId,
                title: 'Reserva cancelada ❌',
                message: `Un cliente ha cancelado la reserva #${bookingId.substring(0, 8)}.`,
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: { bookingId, type: 'BOOKING_CANCELLED' }
            })
        );
        await this.sendPush(ownerId, notification.title, notification.message, { bookingId });
    }

    async notifyExtensionCharged(userId: string, bookingId: string, amount: number, days: number) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId,
                title: 'Cargo por extensión ⏱️',
                message: `Se te ha cobrado $${amount} por ${days} día(s) adicional(es) en #${bookingId.substring(0, 8)}.`,
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: { bookingId, type: 'EXTENSION_CHARGED', amount, days }
            })
        );
        await this.sendPush(userId, notification.title, notification.message, { bookingId });
    }

    async notifyStoreApproved(userId: string, storeName: string) {
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                userId,
                title: 'Tienda aprobada ✅',
                message: `Tu tienda "${storeName}" ha sido aprobada y ya está visible para los viajeros.`,
                category: NotificationCategory.SYSTEM,
                isRead: false,
                metadata: { storeName, type: 'STORE_APPROVED' }
            })
        );
        await this.sendPush(userId, notification.title, notification.message, { storeName });
    }

    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.notificationRepository.count({
            where: { userId, isRead: false },
        });
        return { count };
    }
}
