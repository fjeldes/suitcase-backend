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

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);

        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles.map((r) => r.role.name),
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                // Usamos encadenamiento opcional por si el perfil es null
                name: user.profile
                    ? user.profile.firstName
                    : 'Usuario',
                roles: payload.roles
            }
        };
    }
}