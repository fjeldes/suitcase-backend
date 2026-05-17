import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
// TODO: Cuando se requiera escalar, reemplazar por:
// import { BullModule } from '@nestjs/bullmq'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

import { UsersModule } from './users/users.module'
import { LocationsModule } from './locations/locations.module'
import { BookingsModule } from './bookings/bookings.module'
import { AuthModule } from './auth/auth.module'
import configuration from './config/configuration'
import { envValidationSchema } from './config/env.validations'
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { StorageModule } from './storage/storage.module';
import { CommonModule } from './common/common.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionsModule } from './transactions/transactions.module';
import { FAQsModule } from './faqs/faqs.module';
import { PayoutsModule } from './payouts/payouts.module';
import { TermsModule } from './terms/terms.module';
import { StaffModule } from './staff/staff.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { FinancialsModule } from './financials/financials.module';
import { ClaimsModule } from './claims/claims.module';
import { ErrorLogsModule } from './error-logs/error-logs.module';
import { PromosModule } from './promos/promos.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),

    ScheduleModule.forRoot(),
    // TODO: Cuando se requiera cola de notificaciones con reintentos,
    // descomentar BullMQ y agregar Redis a la infraestructura:
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     connection: {
    //       host: configService.get('redis.host') || 'localhost',
    //       port: configService.get<number>('redis.port') || 6379,
    //     },
    //   }),
    // }),

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
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),

    UsersModule,
    LocationsModule,
    BookingsModule,
    AuthModule,
    ReviewsModule,
    PaymentsModule,
    NotificationsModule,
    MailModule,
    ActivityLogsModule,
    StorageModule,
    TransactionsModule,
    FAQsModule,
    PayoutsModule,
    CommonModule,
    TermsModule,
    StaffModule,
    WebhooksModule,
    FinancialsModule,
    ClaimsModule,
    PromosModule,
    ErrorLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule { }