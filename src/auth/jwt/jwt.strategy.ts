import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret')

        if (!secret) {
            throw new Error('JWT_SECRET is missing')
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret, // 🔥 ahora es string seguro
        })
    }

    async validate(payload: any) {
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        }
    }
}