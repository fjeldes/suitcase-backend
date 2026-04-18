import { Injectable, ConflictException, OnModuleInit } from '@nestjs/common'; // Agregamos OnModuleInit
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entidades y DTOs
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from './entities/profile.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
    ) { }

    // 1. Semilla automática de Roles
    async onModuleInit() {
        const roles = ['admin', 'owner', 'client'];
        for (const roleName of roles) {
            const exists = await this.roleRepository.findOne({ where: { name: roleName } });
            if (!exists) {
                const newRole = this.roleRepository.create({ name: roleName });
                await this.roleRepository.save(newRole);
                console.log(`✅ Rol "${roleName}" inicializado en la base de datos.`);
            }
        }
    }

    // 2. Creación de Usuario con Perfil y Rol
    async create(createUserDto: CreateUserDto) {
        // Hacemos el destructuring del DTO (asegúrate que el DTO tenga estos campos)
        const { email, password, firstName, lastName } = createUserDto as any;

        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el Usuario base
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
        });
        const savedUser = await this.userRepository.save(user);

        // Crear el Perfil vinculado automáticamente
        const profile = this.profileRepository.create({
            firstName,
            lastName,
            user: savedUser,
        });
        await this.profileRepository.save(profile);

        // Asignar el Rol 'owner' por defecto (ahora sabemos que existe por el onModuleInit)
        const role = await this.roleRepository.findOne({ where: { name: 'client' } });
        if (role) {
            const userRole = this.userRoleRepository.create({
                user: savedUser,
                role: role,
            });
            await this.userRoleRepository.save(userRole);
        }

        // Retornamos el usuario (puedes elegir no devolver el password por seguridad)
        const { password: _, ...result } = savedUser;
        return result;
    }

    // 3. Métodos de búsqueda
    findAll() {
        // Agregamos relaciones para que el admin vea todo el detalle
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
        return this.userRepository.findOne({
            where: { id: id as any },
            relations: ['profile', 'roles', 'roles.role'],
        });
    }
}