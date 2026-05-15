// TODO: Cuando se requiera la cola de notificaciones con reintentos vía Redis,
// descomentar todo este archivo y agregar NotificationsProcessor a providers en notifications.module.ts

// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { DeviceToken } from './entities/device-token.entity';
// import { Expo, ExpoPushMessage } from 'expo-server-sdk';
// import { Logger } from '@nestjs/common';

// const expo = new Expo();

// @Processor('push-notifications')
// export class NotificationsProcessor extends WorkerHost {
//     private readonly logger = new Logger(NotificationsProcessor.name);

//     constructor(
//         @InjectRepository(DeviceToken)
//         private readonly tokenRepository: Repository<DeviceToken>,
//     ) {
//         super();
//     }

//     async process(job: Job): Promise<any> {
//         const { userId, title, body } = job.data;
//         const tokens = await this.tokenRepository.find({
//             where: { user: { id: userId } }
//         });

//         if (tokens.length === 0) return { status: 'no_tokens' };

//         const messages: ExpoPushMessage[] = [];
//         for (const pushToken of tokens) {
//             if (!Expo.isExpoPushToken(pushToken.token)) {
//                 this.logger.error(`Token inválido: ${pushToken.token}`);
//                 continue;
//             }
//             messages.push({
//                 to: pushToken.token,
//                 sound: 'default',
//                 title,
//                 body,
//                 data: { withSome: 'data' },
//             });
//         }

//         const chunks = expo.chunkPushNotifications(messages);
//         for (const chunk of chunks) {
//             try {
//                 const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//                 this.logger.log('Notificación enviada con éxito a Expo');
//             } catch (error) {
//                 this.logger.error('Error enviando notificación:', error);
//             }
//         }

//         return { success: true };
//     }
// }
