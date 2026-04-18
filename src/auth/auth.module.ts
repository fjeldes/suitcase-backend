import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from 'src/users/users.module'
import { JwtStrategy } from './jwt/jwt.strategy'

@Module({
  imports: [
    UsersModule,
    ConfigModule, // 🔥 recomendado

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret')
        const expiresIn = configService.get<string>('jwt.expiresIn') ?? '1d'

        if (!secret) {
          throw new Error('JWT_SECRET is missing')
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        }
      },
    })
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule { }