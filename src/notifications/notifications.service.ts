// backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm'; // O el que uses
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { DeviceToken } from './entities/device-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';

@Injectable()
export class NotificationsService {
    constructor(
        // 1. Inyectamos la cola (lo que ya tenías)
        @InjectQueue('push-notifications') private readonly notificationQueue: Queue,

        // 2. Inyectamos el repositorio (lo que falta para el controlador)
        @InjectRepository(DeviceToken)
        private readonly deviceTokenRepository: Repository<DeviceToken>,
    ) { }

    /**
     * LÓGICA PARA EL CONTROLADOR (Guardar el token en DB)
     */
    async registerToken(userId: string, dto: RegisterTokenDto) {
        const { token, provider, deviceModel } = dto;

        // 1. Ahora TypeScript reconocerá 'userId' porque existe en la entidad
        let deviceToken = await this.deviceTokenRepository.findOne({
            where: {
                token: token,
                userId: userId
            },
        });

        if (deviceToken) {
            // 2. Ahora reconocerá 'updatedAt'
            deviceToken.updatedAt = new Date();
            return this.deviceTokenRepository.save(deviceToken);
        }

        // 3. Al crear, usamos userId directamente
        const newToken = this.deviceTokenRepository.create({
            token,
            provider,
            deviceModel,
            userId, // Ahora sí es una propiedad conocida
        });

        return this.deviceTokenRepository.save(newToken);
    }

    /**
     * LÓGICA PARA ENCOLAR (Lo que ya tenías)
     */
    async notifyBookingCreated(userId: string, bookingId: string) {
        await this.notificationQueue.add('send-push', {
            userId,
            title: '¡Reserva confirmada! ✅',
            body: `Tu reserva #${bookingId.substring(0, 8)} ha sido creada con éxito.`,
        }, { attempts: 3, backoff: 5000 });
    }

    async notifyNewBookingForOwner(ownerId: string, bookingId: string) {
        await this.notificationQueue.add('send-push', {
            userId: ownerId,
            title: '¡Nueva reserva recibida! 📦',
            body: `Tienes una nueva solicitud de reserva (#${bookingId.substring(0, 8)}) pendiente.`,
        }, { attempts: 3, backoff: 5000 });
    }
}