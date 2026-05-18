import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { DataSource } from 'typeorm';
import * as crypto from 'node:crypto';

import { MailService } from 'src/mail/mail.service';
import { TermsService } from 'src/terms/terms.service';
import { TermsType } from 'src/terms/entities/terms.entity';
import { Profile } from 'src/users/entities/profile.entity';
import { Role } from 'src/users/entities/role.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private googleClient: OAuth2Client;
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private dataSource: DataSource,
        private readonly configService: ConfigService,
        private mailService: MailService,
        private readonly termsService: TermsService,
    ) {
        const googleId = this.configService.get<string>('google.clientId');
        this.googleClient = new OAuth2Client(googleId);
    }

    /**
     * Valida las credenciales del usuario
     */
    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!user.password) {
            throw new UnauthorizedException('Please log in with Google');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        if (!user.isEmailVerified) {
            throw new UnauthorizedException({ message: 'Please verify your email before logging in', email: user.email });
        }

        return user;
    }

    private generateOTP(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    private getOTPExpiry(): Date {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);
        return expiry;
    }

    /**
     * Genera el par de tokens (Access y Refresh) y formatea la data del usuario
     */
    private async generateTokens(user: any) {
        const roles = user.roles?.map((r: any) => (r.role ? r.role.name : r)) || [];
        const payload = {
            sub: user.id,
            email: user.email,
            roles,
        };

        return {
            accessToken: await this.jwtService.signAsync(payload, {
                expiresIn: '15m',
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
                expiresIn: '7d',
            }),
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.firstName || 'Usuario',
                roles: payload.roles,
                mustChangePassword: user.mustChangePassword || false,
            },
        };
    }

    /**
     * Inicia sesión tradicional
     */
    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        return this.generateTokens(user);
    }

    /**
     * Refresca la sesión usando el Refresh Token
     */
    async refreshTokens(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const user = await this.usersService.findOne(payload.sub);
            if (!user) throw new UnauthorizedException('User no longer exists');
            return this.generateTokens(user);
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    /**
     * Crea un nuevo usuario con perfil y rol en una transacción atómica
     * Retorna los tokens de acceso inmediatamente.
     */
    async signUp(createUserDto: CreateUserDto) {
        const { email, password, firstName, lastName } = createUserDto;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verificar duplicados
            const existingUser = await queryRunner.manager.findOne(User, { where: { email } });
            if (existingUser) {
                throw new ConflictException('User already exists');
            }

            // 2. Hashear password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Crear Usuario base con OTP
            const otpCode = this.generateOTP();
            const otpExpiresAt = this.getOTPExpiry();

            const user = queryRunner.manager.create(User, {
                email,
                password: hashedPassword,
                isEmailVerified: false,
                otpCode,
                otpExpiresAt,
            });

            if (process.env.NODE_ENV !== 'production') {
                this.logger.debug(`[DEV ONLY] OTP for ${email}: ${otpCode}`);
            }

            const savedUser = await queryRunner.manager.save(user);

            // 4. Crear Perfil vinculado
            const profile = queryRunner.manager.create(Profile, {
                firstName,
                lastName,
                user: savedUser,
            });
            await queryRunner.manager.save(profile);

            // 5. Asignar Rol 'client'
            const role = await queryRunner.manager.findOne(Role, { where: { name: 'client' } });
            if (!role) {
                throw new InternalServerErrorException('Default role "client" not found');
            }

            const userRole = queryRunner.manager.create(UserRole, {
                user: savedUser,
                role: role,
            });
            await queryRunner.manager.save(userRole);

            // Confirmar transacción
            await queryRunner.commitTransaction();

            // Enviar email de verificación de forma asíncrona (no bloqueante)
            this.mailService.sendVerificationEmail(email, otpCode).catch(e => console.error(e));

            // 6. Generar tokens automáticamente tras el registro
            // Construimos un objeto que emule la estructura de relaciones para generateTokens
            const userForTokens = {
                ...savedUser,
                profile,
                roles: [{ role: { name: 'client' } }]
            };

            return this.generateTokens(userForTokens);

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // ... tus otros métodos (login, signup, etc.)

    async loginWithGoogle(token: string) {
        try {
            // 1. Validar el token directamente con el cliente de Google
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: this.configService.get<string>('google.clientId'),
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new UnauthorizedException('Invalid Google token');
            }

            const { email, given_name, family_name, picture } = payload;

            // 2. Buscar si el usuario ya existe
            let user = await this.usersService.findByEmail(email);

            if (!user) {
                // 3. Si no existe, lo registramos con todos sus datos
                user = await this.registerSocialUser(
                    email,
                    given_name || 'Nuevo',
                    family_name || 'Usuario',
                    picture,
                );
            }

            // 4. Generar tus JWT habituales
            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    async registerSocialUser(
        email: string,
        firstName: string,
        lastName: string,
        avatar?: string,
    ) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear instancia de Usuario
            const newUser = new User();
            newUser.email = email;
            newUser.password = null;
            newUser.isEmailVerified = true;
            const savedUser = await queryRunner.manager.save(newUser);

            // Crear Perfil con el campo 'avatar'
            const profile = queryRunner.manager.create(Profile, {
                firstName,
                lastName,
                avatar,
                user: savedUser,
            });
            await queryRunner.manager.save(profile);

            // Asignar Rol 'client'
            const role = await queryRunner.manager.findOne(Role, {
                where: { name: 'client' },
            });

            if (!role) {
                throw new Error('Default role "client" not found in database');
            }

            const userRole = new UserRole();
            userRole.user = savedUser;
            userRole.role = role;
            await queryRunner.manager.save(userRole);

            await queryRunner.commitTransaction();

            try {
                await this.termsService.autoAcceptLatest(savedUser.id, TermsType.CLIENT);
            } catch { /* terms acceptance is non-critical */ }

            return {
                ...savedUser,
                profile,
                roles: [userRole],
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Asigna el rol 'owner' al usuario autenticado.
     * Es idempotente: si el usuario ya tiene el rol, retorna los tokens actuales sin error.
     * Retorna nuevos tokens para que el frontend actualice el store automáticamente.
     */
    async becomeOwner(userId: string) {
        const user = await this.usersService.findOne(userId);
        if (!user) throw new Error('User not found');

        const alreadyOwner = user.roles?.some(
            (ur: any) => (ur.role?.name ?? ur) === 'owner'
        );

        if (!alreadyOwner) {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const ownerRole = await queryRunner.manager.findOne(Role, {
                    where: { name: 'owner' },
                });
                if (!ownerRole) throw new Error('Role "owner" not found');

                const newUserRole = queryRunner.manager.create(UserRole, {
                    user: { id: userId },
                    role: ownerRole,
                });
                await queryRunner.manager.save(newUserRole);
                await queryRunner.commitTransaction();
            } catch (err) {
                await queryRunner.rollbackTransaction();
                throw err;
            } finally {
                await queryRunner.release();
            }
        }

        // Refrescar el usuario desde DB para incluir el nuevo rol en los tokens
        const updatedUser = await this.usersService.findOne(userId);
        return this.generateTokens(updatedUser);
    }

    // --- NUEVOS MÉTODOS OTP ---

    async verifyEmail(email: string, code: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found');
        if (user.isEmailVerified) return { message: 'Email already verified' };

        if (user.otpCode !== code || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired code');
        }

        await this.usersService.update(user.id, {
            isEmailVerified: true,
            otpCode: null,
            otpExpiresAt: null,
        });

        this.mailService.sendWelcomeEmail(email, user.profile?.firstName || 'User', 'es');

        // Retorna tokens para que el usuario pueda ingresar de una
        return this.generateTokens(await this.usersService.findOne(user.id));
    }

    async resendVerificationCode(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found');
        if (user.isEmailVerified) return { message: 'Email already verified' };

        const otpCode = this.generateOTP();
        const otpExpiresAt = this.getOTPExpiry();

        await this.usersService.update(user.id, { otpCode, otpExpiresAt });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`[DEV ONLY] Resend OTP for ${email}: ${otpCode}`);
        }

        this.mailService.sendVerificationEmail(email, otpCode).catch(e => console.error(e));
        return { message: 'Verification code sent', code: process.env.NODE_ENV !== 'production' ? otpCode : undefined };
    }

    async changeEmail(userId: string, newEmail: string) {
        const user = await this.usersService.findOne(userId);
        if (!user) throw new UnauthorizedException('User not found');
        if (user.isEmailVerified) return { message: 'Email already verified' };

        const existing = await this.usersService.findByEmail(newEmail);
        if (existing) throw new BadRequestException('Email already in use');

        const otpCode = this.generateOTP();
        const otpExpiresAt = this.getOTPExpiry();

        await this.usersService.update(user.id, { email: newEmail, otpCode, otpExpiresAt });
        this.mailService.sendVerificationEmail(newEmail, otpCode).catch(e => console.error(e));

        return { message: 'Verification code sent to new email', email: newEmail, code: process.env.NODE_ENV !== 'production' ? otpCode : undefined };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) return { message: 'If the email exists, a code was sent' }; // Evitar user enumeration

        const otpCode = this.generateOTP();
        const otpExpiresAt = this.getOTPExpiry();

        await this.usersService.update(user.id, { otpCode, otpExpiresAt });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`[DEV ONLY] Password Reset OTP for ${email}: ${otpCode}`);
        }

        this.mailService.sendPasswordResetEmail(email, otpCode).catch(e => console.error(e));
        return { message: 'If the email exists, a code was sent' };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.usersService.findOne(userId);
        if (!user) throw new UnauthorizedException('User not found');
        if (!user.password) throw new BadRequestException('No password set — use Google login');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new BadRequestException('Current password is incorrect');

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, { password: hashed, mustChangePassword: false });
        return { message: 'Password updated' };
    }

    async resetPassword(email: string, code: string, newPassword: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid request');

        if (user.otpCode !== code || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired code');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.usersService.update(user.id, {
            password: hashedPassword,
            otpCode: null,
            otpExpiresAt: null,
        });

        return { message: 'Password updated successfully' };
    }
}