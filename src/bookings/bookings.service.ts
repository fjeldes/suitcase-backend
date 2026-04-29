import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'
import { Booking } from './entities/booking.entity'
import { Location } from 'src/locations/entities/location.entity'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { PreviewBookingDto } from './dto/preview-booking.dto'
import { UserRole } from 'src/common/enums/user-role.enum'
import { NotificationsService } from 'src/notifications/notifications.service'

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,

        @InjectRepository(Location)
        private locationRepository: Repository<Location>,

        @InjectRepository(LocationOwner)
        private locationOwnerRepository: Repository<LocationOwner>,

        private readonly notificationsService: NotificationsService,
    ) { }

    async create(dto: CreateBookingDto, userId: string) {
        const { locationId, startDate, endDate } = dto;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Validaciones iniciales
        if (start >= end) throw new BadRequestException('Invalid date range');

        const location = await this.locationRepository.findOne({
            where: { id: locationId },
            relations: ['owners', 'owners.user'],
        });
        if (!location) throw new NotFoundException('Location not found');

        const items = {
            small: dto.items?.small ?? 0,
            medium: dto.items?.medium ?? 0,
            large: dto.items?.large ?? 0,
        };

        // 2. Validar que el usuario no tenga ya una reserva activa
        await this.ensureNoActiveBooking(userId, locationId);

        // 3. Calcular Disponibilidad y Precio
        const isAvailable = await this.checkAvailability(location, start, end, items);
        const status: 'pending' | 'confirmed' = isAvailable ? 'confirmed' : 'pending';

        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = this.calculateTotalPrice(location, items, days);

        // 4. Crear y Guardar
        const newBooking = this.bookingRepository.create({
            startDate: start,
            endDate: end,
            totalPrice,
            status,
            items,
            user: { id: userId },
            location: { id: locationId },
        });

        const savedBooking = await this.bookingRepository.save(newBooking);

        // 5. Orquestar Notificaciones (Sin await si no quieres bloquear la respuesta)
        this.handleBookingNotifications(userId, location, savedBooking);

        return savedBooking;
    }

    async update(id: string, dto: UpdateBookingDto, userId: string) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['location', 'user'],
        })

        if (!booking) {
            throw new NotFoundException('Booking not found')
        }

        // 🔥 ownership
        if (booking.user.id !== userId) {
            throw new BadRequestException('Not your booking')
        }

        if (booking.status === 'cancelled') {
            throw new BadRequestException('Cannot modify cancelled booking')
        }

        // 🔹 fechas normalizadas
        const startDate = dto.startDate
            ? new Date(dto.startDate)
            : booking.startDate

        const endDate = dto.endDate
            ? new Date(dto.endDate)
            : booking.endDate

        // 🔹 items normalizados
        const items = {
            small: dto.items?.small ?? booking.items?.small ?? 0,
            medium: dto.items?.medium ?? booking.items?.medium ?? 0,
            large: dto.items?.large ?? booking.items?.large ?? 0,
        }

        const totalItems = items.small + items.medium + items.large

        if (totalItems === 0) {
            throw new BadRequestException('At least one item is required')
        }

        // 🔹 validar fechas
        if (startDate >= endDate) {
            throw new BadRequestException('Invalid date range')
        }

        // 🔥 buscar otros bookings (excluyendo este)
        const overlappingBookings = await this.bookingRepository
            .createQueryBuilder('booking')
            .where('booking.locationId = :locationId', {
                locationId: booking.location.id,
            })
            .andWhere('booking.id != :id', { id })
            .andWhere(
                `(booking.startDate <= :endDate AND booking.endDate >= :startDate)`,
                { startDate, endDate },
            )
            .andWhere('booking.status = :status', { status: 'confirmed' })
            .getMany()

        // 🔥 calcular uso actual
        const used = { small: 0, medium: 0, large: 0 }

        overlappingBookings.forEach((b) => {
            used.small += b.items?.small || 0
            used.medium += b.items?.medium || 0
            used.large += b.items?.large || 0
        })

        // 🔥 validar capacidad
        const exceeds =
            used.small + items.small > booking.location.capacity.small ||
            used.medium + items.medium > booking.location.capacity.medium ||
            used.large + items.large > booking.location.capacity.large

        let status: 'pending' | 'confirmed' = 'confirmed'

        if (exceeds) {
            status = 'pending'
        }

        // 🔥 recalcular precio POR TIPO
        const days =
            (endDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24)

        const totalPrice =
            days *
            (
                items.small * Number(booking.location.pricePerDay.small) +
                items.medium * Number(booking.location.pricePerDay.medium) +
                items.large * Number(booking.location.pricePerDay.large)
            )

        // 🔥 actualizar
        booking.startDate = startDate
        booking.endDate = endDate
        booking.items = items
        booking.status = status
        booking.totalPrice = totalPrice

        return this.bookingRepository.save(booking)
    }

    async cancel(id: string, userId: string) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['user'],
        })

        if (!booking) {
            throw new NotFoundException('Booking not found')
        }

        // 🔥 ownership
        if (booking.user.id !== userId) {
            throw new BadRequestException('Not your booking')
        }

        if (booking.status === 'cancelled') {
            throw new BadRequestException('Booking already cancelled')
        }

        // 🔥 cancelar
        booking.status = 'cancelled'

        return this.bookingRepository.save(booking)
    }

    // BookingsService.ts
    async findMyBookings(userId: string, roles: UserRole[], filters: any) {
        const { status, locationId, limit } = filters;
        const query = this.bookingRepository.createQueryBuilder('booking')
            .leftJoinAndSelect('booking.location', 'location')
            .leftJoinAndSelect('booking.user', 'customer')
            .leftJoinAndSelect('customer.profile', 'profile');
        // Si el usuario es OWNER, filtramos por propiedad de locación
        if (roles.includes(UserRole.OWNER)) {
            query.innerJoin('location.owners', 'lo')
                .andWhere('lo.userId = :userId', { userId });

            if (locationId) {
                query.andWhere('booking.locationId = :locationId', { locationId });
            }
        }
        // Si SOLO es USER o si quieres sumar sus bookings personales
        else {
            query.andWhere('booking.userId = :userId', { userId });
        }

        // Filtro de Status (evita el string 'all')
        if (status && status !== 'all') {
            query.andWhere('booking.status = :status', { status });
        }

        return await query.getMany();
    }

    async findByLocation(locationId: string, userId: string) {
        // 🔥 validar ownership real
        await this.validateOwnership(locationId, userId)

        return this.bookingRepository.find({
            where: {
                location: { id: locationId },
            },
            relations: ['user'],
            order: {
                startDate: 'DESC',
            },
        })
    }

    async findAll() {
        return this.bookingRepository.find({
            relations: ['user', 'location'],
        })
    }

    async validateOwnership(locationId: string, userId: string) {
        const ownership = await this.locationOwnerRepository.findOne({
            where: {
                location: { id: locationId },
                user: { id: userId },
            },
        })

        if (!ownership) {
            throw new BadRequestException('You are not the owner of this location')
        }
    }

    async preview(dto: PreviewBookingDto, userId: string) {
        const { locationId, startDate, endDate } = dto

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (start >= end) {
            throw new BadRequestException('Invalid date range')
        }

        const location = await this.locationRepository.findOne({
            where: { id: locationId },
        })

        if (!location) {
            throw new NotFoundException('Location not found')
        }

        // 🔥 normalizar items
        const items = {
            small: dto.items?.small ?? 0,
            medium: dto.items?.medium ?? 0,
            large: dto.items?.large ?? 0,
        }

        const totalItems = items.small + items.medium + items.large

        if (totalItems === 0) {
            throw new BadRequestException('At least one item is required')
        }

        // 🔥 buscar bookings solapados
        const overlappingBookings = await this.bookingRepository
            .createQueryBuilder('booking')
            .where('booking.locationId = :locationId', { locationId })
            .andWhere(
                `(booking.startDate <= :endDate AND booking.endDate >= :startDate)`,
                { startDate: start, endDate: end },
            )
            .andWhere('booking.status = :status', { status: 'confirmed' })
            .getMany()

        const used = { small: 0, medium: 0, large: 0 }

        overlappingBookings.forEach((b) => {
            used.small += b.items?.small || 0
            used.medium += b.items?.medium || 0
            used.large += b.items?.large || 0
        })

        const availability = {
            small: location.capacity.small - used.small,
            medium: location.capacity.medium - used.medium,
            large: location.capacity.large - used.large,
        }

        // 🔥 ver si excede
        const exceeds =
            items.small > availability.small ||
            items.medium > availability.medium ||
            items.large > availability.large

        let status: 'pending' | 'confirmed' = 'confirmed'

        if (exceeds) {
            status = 'pending'
        }

        // 🔥 calcular precio
        const days =
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)

        const totalPrice =
            days *
            (
                items.small * Number(location.pricePerDay.small) +
                items.medium * Number(location.pricePerDay.medium) +
                items.large * Number(location.pricePerDay.large)
            )

        return {
            status,
            totalPrice,
            currency: 'USD', // puedes cambiar después
            availability,
            breakdown: {
                days,
                items,
                pricePerDay: location.pricePerDay,
            },
        }
    }

    async processQr(qrCode: string, ownerId: string) {
        const booking = await this.getBookingForOwner(qrCode, ownerId);

        // MÁQUINA DE ESTADOS
        switch (booking.status) {
            case 'confirmed':
                booking.status = 'in_storage';
                booking.checkedInAt = new Date();
                break;

            case 'in_storage':
                booking.status = 'completed';
                booking.checkedOutAt = new Date();
                break;

            default:
                throw new BadRequestException(`La reserva no puede ser procesada (Estado: ${booking.status})`);
        }

        return this.bookingRepository.save(booking);
    }

    // bookings.service.ts

    async getBookingForOwner(qrCode: string, userId: string) {
        // 1. Buscamos la reserva usando el qrCode
        const booking = await this.bookingRepository.findOne({
            where: { qrCode },
            relations: [
                'user',
                'user.profile',      // <--- AGREGA ESTO para traer el nombre
                'location',
                'location.owners',
                'location.owners.user'
            ],
        });

        // 2. Si no existe, error 404
        if (!booking) {
            throw new NotFoundException('Reserva no encontrada');
        }

        // 3. VALIDACIÓN DE SEGURIDAD: 
        // Verificamos si el userId del que escanea está en la lista de owners de esa location
        const isAuthorized = booking.location.owners.some(
            (owner) => owner.user.id === userId
        );

        if (!isAuthorized) {
            throw new ForbiddenException(
                'No tienes permiso para gestionar reservas de este local'
            );
        }

        // 4. Retornamos la reserva. 
        // Aquí puedes limpiar el objeto para no enviar datos sensibles de los owners
        const { location, ...bookingData } = booking;

        return {
            ...bookingData,
            locationName: location.name,
            // Agregamos un flag para que el front sepa qué tipo de acción toca
            suggestedAction: booking.status === 'confirmed' ? 'check-in' : 'check-out'
        };
    }
    private async checkAvailability(location: Location, start: Date, end: Date, requestedItems: any): Promise<boolean> {
        const overlapping = await this.bookingRepository.find({
            where: {
                location: { id: location.id },
                status: 'confirmed',
                startDate: LessThanOrEqual(end),
                endDate: MoreThanOrEqual(start),
            },
        });

        const used = { small: 0, medium: 0, large: 0 };
        overlapping.forEach((b) => {
            used.small += b.items?.small || 0;
            used.medium += b.items?.medium || 0;
            used.large += b.items?.large || 0;
        });

        return (
            used.small + requestedItems.small <= location.capacity.small &&
            used.medium + requestedItems.medium <= location.capacity.medium &&
            used.large + requestedItems.large <= location.capacity.large
        );
    }

    private calculateTotalPrice(location: Location, items: any, days: number): number {
        const d = days <= 0 ? 1 : days; // Asegurar al menos 1 día
        return (
            d *
            (items.small * Number(location.pricePerDay.small) +
                items.medium * Number(location.pricePerDay.medium) +
                items.large * Number(location.pricePerDay.large))
        );
    }

    private async ensureNoActiveBooking(userId: string, locationId: string) {
        const existing = await this.bookingRepository.findOne({
            where: {
                user: { id: userId },
                location: { id: locationId },
                status: In(['pending', 'confirmed']),
            },
        });

        if (existing) {
            throw new BadRequestException('You already have an active booking here');
        }
    }

    private async handleBookingNotifications(userId: string, location: Location, booking: Booking) {
        try {
            // 1. Notificación al Cliente (quien hace la reserva)
            await this.notificationsService.notifyBookingCreated(userId, booking.id);
    
            // 2. Notificación a los Dueños (LocationOwner)
            // Como 'owners' es un arreglo, notificamos a todos los asociados
            if (location.owners && location.owners.length > 0) {
                const notificationPromises = location.owners.map(owner => {
                    // Verificamos que el objeto user esté cargado y tenga ID
                    if (owner.user?.id) {
                        return this.notificationsService.notifyNewBookingForOwner(
                            owner.user.id,
                            booking.id,
                        );
                    }
                });
    
                // Usamos Promise.all para que se procesen todas en paralelo en la cola
                await Promise.all(notificationPromises);
            }
        } catch (error) {
            console.error('Error sending notifications:', error);
            // Mantenemos el error silencioso para no romper el flujo del cliente
        }
    }

}