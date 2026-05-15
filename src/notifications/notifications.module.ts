import { Module } from '@nestjs/common';
// TODO: Cuando se requiera BullMQ (Redis), descomentar:
// import { BullModule } from '@nestjs/bullmq';
// import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceToken, Notification]),
    // TODO: Descomentar cuando se agregue Redis:
    // BullModule.registerQueue({
    //   name: 'push-notifications',
    // }),
  ],
  providers: [
    NotificationsService,
    // NotificationsProcessor,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule { }
