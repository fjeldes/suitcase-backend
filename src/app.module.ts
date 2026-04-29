import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from './users/users.module'
import { LocationsModule } from './locations/locations.module'
import { BookingsModule } from './bookings/bookings.module'
import { AuthModule } from './auth/auth.module'
import configuration from './config/configuration'
import { envValidationSchema } from './config/env.validations'
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),

    // CONFIGURACIÓN DE BULLMQ
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          // Asegúrate de que estas keys existan en tu 'configuration'
          host: configService.get('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),

        autoLoadEntities: true,
        synchronize: true, // Dvelopment only, use migrations in production
      }),
    }),

    UsersModule,
    LocationsModule,
    BookingsModule,
    AuthModule,
    NotificationsModule,
  ],
})
export class AppModule { }