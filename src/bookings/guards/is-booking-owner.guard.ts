// src/bookings/guards/is-booking-owner.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';

@Injectable()
export class IsBookingOwnerGuard implements CanActivate {
    constructor(
        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user.userId;
        const bookingId = request.params.id;

        if (!bookingId) return true;

        // Cargamos todas las relaciones necesarias para validar permisos
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: [
                'user',
                'location',
                'location.owners',
                'location.owners.user',
                'review',
                'transactions',
            ],
        });

        if (!booking) {
            throw new NotFoundException(`La reserva con ID ${bookingId} no existe.`);
        }

        // Validación de permisos
        const isCustomer = booking.user.id === userId;
        const isStoreOwner = booking.location.owners.some(
            (o) => o.user?.id === userId,
        );

        if (!isCustomer && !isStoreOwner) {
            throw new ForbiddenException('No tienes permiso para acceder a esta reserva.');
        }

        // Guardamos el objeto booking en la request para que el Service no tenga que buscarlo otra vez
        request.booking = booking;

        return true;
    }
}