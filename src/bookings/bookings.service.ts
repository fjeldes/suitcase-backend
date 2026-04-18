import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Booking } from './entities/booking.entity'
import { Location } from 'src/locations/entities/location.entity'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { PreviewBookingDto } from './dto/preview-booking.dto'

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,

        @InjectRepository(Location)
        private locationRepository: Repository<Location>,

        @InjectRepository(LocationOwner)
        private locationOwnerRepository: Repository<LocationOwner>
    ) { }

    async create(dto: CreateBookingDto, userId: string) {
        const { locationId, startDate, endDate } = dto

        // 🔹 1. Validar fechas
        const start = new Date(startDate)
        const end = new Date(endDate)

        if (start >= end) {
            throw new BadRequestException('Invalid date range')
        }

        // 🔹 2. Buscar location
        const location = await this.locationRepository.findOne({
            where: { id: locationId },
        })

        if (!location) {
            throw new NotFoundException('Location not found')
        }

        // 🔥 3. Normalizar items
        const items = {
            small: dto.items?.small ?? 0,
            medium: dto.items?.medium ?? 0,
            large: dto.items?.large ?? 0,
        }

        const totalItems = items.small + items.medium + items.large

        if (totalItems === 0) {
            throw new BadRequestException('At least one item is required')
        }

        // 🔥 4. Validar booking activo del usuario
        const existingBooking = await this.bookingRepository.findOne({
            where: {
                user: { id: userId },
                location: { id: locationId },
                status: In(['pending', 'confirmed']),
            },
        })

        if (existingBooking) {
            throw new BadRequestException(
                'You already have an active booking for this location',
            )
        }

        // 🔥 5. Obtener bookings solapados (solo CONFIRMED)
        const overlappingBookings = await this.bookingRepository
            .createQueryBuilder('booking')
            .where('booking.locationId = :locationId', { locationId })
            .andWhere(
                `(booking.startDate <= :endDate AND booking.endDate >= :startDate)`,
                { startDate: start, endDate: end },
            )
            .andWhere('booking.status = :status', { status: 'confirmed' })
            .getMany()

        // 🔥 6. Calcular uso actual
        const used = {
            small: 0,
            medium: 0,
            large: 0,
        }

        overlappingBookings.forEach((b) => {
            used.small += b.items?.small || 0
            used.medium += b.items?.medium || 0
            used.large += b.items?.large || 0
        })

        // 🔥 7. Validar capacidad
        const exceeds =
            used.small + items.small > location.capacity.small ||
            used.medium + items.medium > location.capacity.medium ||
            used.large + items.large > location.capacity.large

        let status: 'pending' | 'confirmed' = 'confirmed'

        if (exceeds) {
            status = 'pending'
        }

        // 🔥 8. Calcular precio POR TIPO
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

        // 🔹 9. Crear booking
        const booking = this.bookingRepository.create({
            startDate: start,
            endDate: end,
            totalPrice,
            status,
            items,
            user: { id: userId },
            location: { id: locationId },
        })

        return this.bookingRepository.save(booking)
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

    async findMyBookings(userId: string) {
        return this.bookingRepository.find({
            where: {
                user: { id: userId },
            },
            relations: ['location'],
            order: {
                startDate: 'DESC',
            },
        })
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
}