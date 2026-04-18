import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { UsersModule } from './users/users.module'
import { LocationsModule } from './locations/locations.module'
import { BookingsModule } from './bookings/bookings.module'
import { AuthModule } from './auth/auth.module'
import configuration from './config/configuration'
import { envValidationSchema } from './config/env.validations'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
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
  ],
})
export class AppModule {}