import {
    Injectable,
    ConflictException,
    OnModuleInit,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entidades y DTOs
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from './entities/profile.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
        @InjectRepository(UserRole)
        private userRoleRepository: Repository<UserRole>,
        private storageService: StorageService,
    ) { }

    /**
     * 1. Semilla automática de Roles
     * Se ejecuta al iniciar el módulo para asegurar que los roles existan.
     */
    async onModuleInit() {
        const roles = ['admin', 'owner', 'client', 'staff'];
        for (const roleName of roles) {
            const exists = await this.roleRepository.findOne({ where: { name: roleName } });
            if (!exists) {
                const newRole = this.roleRepository.create({ name: roleName });
                await this.roleRepository.save(newRole);
                console.log(`✅ Rol "${roleName}" inicializado en la base de datos.`);
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            const adminEmail = 'admin@example.com';
            const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });
            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const adminUser = this.userRepository.create({
                    email: adminEmail,
                    password: hashedPassword,
                    isEmailVerified: true,
                    mustChangePassword: true,
                });
                const saved = await this.userRepository.save(adminUser);

                const role = await this.roleRepository.findOne({ where: { name: 'admin' } });
                if (role) {
                    await this.userRoleRepository.save({ user: { id: saved.id }, role: { id: role.id } });
                }

                const profile = this.profileRepository.create({ firstName: 'Admin', user: saved });
                await this.profileRepository.save(profile);

                console.log('✅ Admin user created (admin@example.com / admin123)');
            }
        }
    }

    /**
     * 3. Métodos de búsqueda
     */
    findAll() {
        return this.userRepository.find({
            relations: ['profile', 'roles', 'roles.role']
        });
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({
            where: { email },
            relations: ['profile', 'roles', 'roles.role'],
        });
    }

    async findOne(id: string) {
        // Nota: Si usas UUIDs, asegúrate de que el id sea del tipo correcto
        return this.userRepository.findOne({
            where: { id: id as any },
            relations: ['profile', 'roles', 'roles.role'],
        });
    }

    async update(id: string, updateData: Partial<User>) {
        await this.userRepository.update(id, updateData);
        return this.findOne(id);
    }

    async updateProfile(userId: string, profileData: Partial<Profile>) {
        const user = await this.userRepository.findOne({
            where: { id: userId as any },
            relations: ['profile']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.profile) {
            // Si ya tenía una foto anterior, la borramos de GCS para no llenar el bucket
            if (user.profile.avatar && profileData.avatar) {
                await this.storageService.deleteFile(user.profile.avatar);
            }
            await this.profileRepository.update(user.profile.id, profileData);
        } else {
            const newProfile = this.profileRepository.create({ ...profileData, user });
            await this.profileRepository.save(newProfile);
        }

        const updatedUser = await this.findOne(userId);
        
        // Normalizamos para el frontend
        if (updatedUser) {
            // 1. Roles: de objetos a lista de strings
            if (updatedUser.roles) {
                (updatedUser as any).roles = updatedUser.roles.map(r => r.role.name);
            }
            // 2. Name: combinamos firstName y lastName del profile
            if (updatedUser.profile) {
                (updatedUser as any).name = `${updatedUser.profile.firstName || ''} ${updatedUser.profile.lastName || ''}`.trim();
            }
        }

        return updatedUser;
    }
}