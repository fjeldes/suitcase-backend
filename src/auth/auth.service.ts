import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email)
        if (!user) throw new UnauthorizedException('Invalid credentials')

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) throw new UnauthorizedException('Invalid credentials')

        return user
    }

    // 1. Centralizamos la creación de tokens
    private async generateTokens(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles?.map((r: any) => r.role.name) || [],
        };

        return {
            accessToken: await this.jwtService.signAsync(payload, {
                expiresIn: '15m', // El token de acceso dura poco
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
                expiresIn: '7d', // El token de refresco dura mucho
            }),
            user: {
                id: user.id,
                email: user.email,
                name: user.profile ? user.profile.firstName : 'Usuario',
                roles: payload.roles,
            },
        };
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        return this.generateTokens(user);
    }

    // 2. Nuevo método para refrescar tokens
    async refreshTokens(refreshToken: string) {
        try {
            // Verificamos el refresh token
            const payload = await this.jwtService.verifyAsync(refreshToken);
            
            // Buscamos al usuario para asegurarnos de que aún existe/está activo
            const user = await this.usersService.findOne(payload.sub);
            if (!user) throw new UnauthorizedException('User no longer exists');

            // Generamos un nuevo par de tokens (Rotación de tokens)
            return this.generateTokens(user);
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}