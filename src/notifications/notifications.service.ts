// backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { DeviceToken } from './entities/device-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
// Importamos el Enum para evitar el error de "Type string is not assignable"
import { Notification, NotificationCategory } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectQueue('push-notifications') private readonly notificationQueue: Queue,

        @InjectRepository(DeviceToken)
        private readonly deviceTokenRepository: Repository<DeviceToken>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    /**
     * LÓGICA PARA EL CONTROLADOR (Guardar el token en DB)
     */
    async registerToken(userId: string, dto: RegisterTokenDto) {
        const { token, provider, deviceModel } = dto;

        let deviceToken = await this.deviceTokenRepository.findOne({
            where: {
                token: token,
                userId: userId
            },
        });

        if (deviceToken) {
            deviceToken.updatedAt = new Date();
            return this.deviceTokenRepository.save(deviceToken);
        }

        const newToken = this.deviceTokenRepository.create({
            token,
            provider,
            deviceModel,
            userId,
        });

        return this.deviceTokenRepository.save(newToken);
    }

    /**
     * LÓGICA PARA ENCOLAR
     */
    async notifyBookingCreated(userId: string, bookingId: string) {
        await this.notificationQueue.add('send-push', {
            userId,
            title: '¡Reserva confirmada! ✅',
            body: `Tu reserva #${bookingId.substring(0, 8)} ha sido creada con éxito.`,
        }, { attempts: 3, backoff: 5000 });
    }

    async notifyNewBookingForOwner(ownerId: string, bookingId: string) {
        // 1. Persistir en la base de datos
        // Usamos .create() primero para que TypeScript valide el objeto antes del .save()
        const notification = await this.notificationRepository.save(
            this.notificationRepository.create({
                // Si en la entidad es una relación ManyToOne, usa userId o user: { id: ownerId }
                userId: ownerId,
                title: '¡Nueva reserva recibida! 📦',
                message: `Tienes una nueva solicitud de reserva (#${bookingId.substring(0, 8)}) pendiente.`,
                // USAR EL ENUM AQUÍ ES CLAVE
                category: NotificationCategory.BOOKINGS,
                isRead: false,
                metadata: {
                    bookingId: bookingId,
                    type: 'NEW_BOOKING'
                }
            })
        );

        // 2. Enviar a la cola de BullMQ para el Push Notification
        await this.notificationQueue.add('send-push', {
            userId: ownerId,
            title: notification.title,
            // Aquí usamos notification.message (asegúrate que en la entidad se llame message y no body)
            body: notification.message,
            data: {
                bookingId: bookingId
            }
        }, { attempts: 3, backoff: 5000 });
    }

    // Dentro de la clase NotificationsService
    async findByUser(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }, // Para que las más nuevas salgan primero
        });
    }
}