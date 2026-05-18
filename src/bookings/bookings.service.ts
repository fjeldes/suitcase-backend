import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service'
import { UserRole } from 'src/common/enums/user-role.enum'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { Location } from 'src/locations/entities/location.entity'
import { NotificationsService } from 'src/notifications/notifications.service'
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'
import { CreateBookingDto } from './dto/create-booking.dto'
import { PreviewBookingDto } from './dto/preview-booking.dto'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { Booking } from './entities/booking.entity'
import { User } from 'src/users/entities/user.entity'
import { PaymentsService } from 'src/payments/payments.service'
import { PromosService } from 'src/promos/promos.service'
import Stripe from 'stripe'
import { BookingCalculator } from './logic/booking.calculator'
import { PaymentMethod, Transaction, TransactionStatus } from 'src/transactions/entities/transaction.entity'
import { StaffAssignment } from 'src/staff/entities/staff-assignment.entity'

@Injectable()
export class BookingsService {
    private readonly GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutos
    private stripe: any;
    constructor(
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,

        @InjectRepository(Location)
        private locationRepository: Repository<Location>,

        // --- AQUÍ LAS QUE TE FALTAN ---
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(LocationOwner)
        private locationOwnerRepository: Repository<LocationOwner>,

        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,


        private readonly notificationsService: NotificationsService,
        private readonly activityLogsService: ActivityLogsService,
        private readonly paymentsService: PaymentsService,
        private readonly promosService: PromosService,
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
            apiVersion: '2023-10-16' as any,
        });
    }

    async create(dto: CreateBookingDto, userId: string) {
        const { locationId, startDate, endDate } = dto;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Validaciones iniciales de fechas
        if (start >= end) throw new BadRequestException('Invalid date range');

        const location = await this.locationRepository.findOne({
            where: { id: locationId },
            relations: ['owners', 'owners.user'],
        });
        if (!location) throw new NotFoundException('Location not found');

        // Determinamos la moneda del local (Default CLP)
        const currency = (location.currency || 'clp').toLowerCase();

        // Validar Horarios de la tienda
        this.validateLocationSchedule(location, start, end);

        const items = {
            small: dto.items?.small ?? 0,
            medium: dto.items?.medium ?? 0,
            large: dto.items?.large ?? 0,
        };

        // 2. Validar que el usuario no tenga ya una reserva activa
        await this.ensureNoActiveBooking(userId, locationId);

        // 3. Calcular Disponibilidad y Precio
        const isAvailable = await this.checkAvailability(location, start, end, items);
        if (!isAvailable) {
            throw new BadRequestException('No space available for the selected items and dates.');
        }

        const days = BookingCalculator.calculateDays(start, end);
        const rawTotalPrice = BookingCalculator.calculatePrice(location.pricePerDay, items, days);

        // Formateamos el precio del owner (ej: CLP sin decimales)
        const ownerPrice = BookingCalculator.formatByCurrency(rawTotalPrice, currency.toUpperCase());

        // --- 4. APLICAR CÓDIGO PROMOCIONAL ---
        let discountAmount = 0;
        let discountedOwnerPrice = ownerPrice;
        if (dto.promoCode) {
          const validation = await this.promosService.validate({
            code: dto.promoCode,
            bookingAmount: ownerPrice,
          });
          discountAmount = validation.discountAmount;
          discountedOwnerPrice = Math.max(0, ownerPrice - discountAmount);
        }

        // Generar el desglose financiero completo (ownerPrice + travelerFee + IVA)
        const financials = BookingCalculator.calculateFinancials(discountedOwnerPrice);
        const totalPrice = financials.totalToPay; // total que paga el viajero

        // --- 5. PROCESO DE PAGO ---
        let providerTransactionId: string | undefined = undefined;

        if (totalPrice > 0) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found.');
            if (!user.stripeCustomerId) {
                throw new BadRequestException('No payment account found. Please register a card first.');
            }

            try {
                const paymentMethods = await this.stripe.paymentMethods.list({
                    customer: user.stripeCustomerId,
                    type: 'card',
                });

                if (paymentMethods.data.length === 0) {
                    throw new BadRequestException('No saved cards found.');
                }

                // Stripe espera el monto en la unidad mínima (centavos para USD, unidad para CLP)
                // Para CLP, Stripe no usa centavos, por eso multiplicamos según la moneda
                const stripeAmount = currency === 'clp' ? totalPrice : Math.round(totalPrice * 100);

                const paymentIntent = await this.stripe.paymentIntents.create({
                    amount: stripeAmount,
                    currency: currency,
                    customer: user.stripeCustomerId,
                    payment_method: paymentMethods.data[0].id,
                    off_session: true,
                    confirm: true,
                });

                if (paymentIntent.status !== 'succeeded') {
                    throw new BadRequestException('Payment failed or requires action.');
                }

                providerTransactionId = paymentIntent.id;

            } catch (error: any) {
                throw new BadRequestException(`Payment failed: ${error.message}`);
            }
        }

        // 6. Crear y Guardar la reserva
        const newBooking = this.bookingRepository.create({
            startDate: start,
            endDate: end,
            totalPrice,
            days,
            status: 'confirmed',
            items,
            declaredValue: dto.declaredValue ?? null,
            promoCode: dto.promoCode?.toUpperCase() ?? null,
            discountAmount,
            user: { id: userId },
            location: { id: locationId },
        });

        const savedBooking = await this.bookingRepository.save(newBooking);

        // Incrementar uso del código promocional
        if (dto.promoCode) {
          this.promosService.incrementUses(dto.promoCode).catch(() => {});
        }

        // 7. Guardar Transacción con Moneda
        await this.transactionRepository.save({
            totalAmount: financials.totalToPay,
            taxAmount: financials.vatIncluded,
            serviceFee: financials.kipGoGross,
            ownerNet: financials.ownerNet,
            currency: currency.toUpperCase(),
            status: TransactionStatus.SUCCEEDED,
            paymentMethod: PaymentMethod.STRIPE,
            providerTransactionId: providerTransactionId,
            booking: savedBooking,
        });

        // 7. Notificaciones y Logs
        this.handleBookingNotifications(userId, location, savedBooking);

        if (location.owners) {
            const itemsSummary = `${items.small + items.medium + items.large}x Items`;
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            for (const owner of location.owners) {
                if (owner.user?.id) {
                    this.activityLogsService.logNewBooking(
                        owner.user.id,
                        locationId,
                        itemsSummary,
                        'Confirmed & Paid',
                        timeStr
                    );
                }
            }
        }

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

        let status: 'pending_payment' | 'confirmed' = 'confirmed'

        if (exceeds) {
            status = 'pending_payment'
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
            relations: ['user', 'location', 'location.owners', 'location.owners.user'],
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

        const savedBooking = await this.bookingRepository.save(booking)

        // Notificar a los owners
        if (booking.location?.owners) {
            for (const owner of booking.location.owners) {
                if (owner.user?.id) {
                    this.activityLogsService.logBookingCancelled(
                        owner.user.id,
                        booking.location.id,
                        `#${booking.id.slice(0, 4)}`
                    );
                    this.notificationsService.notifyBookingCancelled(owner.user.id, booking.id);
                }
            }
        }

        return savedBooking;
    }

    // BookingsService.ts
    async findMyBookings(userId: string, roles: UserRole[], filters: any) {
        const { status, locationId, limit } = filters;

        const query = this.bookingRepository.createQueryBuilder('booking')
            .leftJoinAndSelect('booking.location', 'location')
            .leftJoinAndSelect('booking.user', 'customer')
            .leftJoinAndSelect('customer.profile', 'profile');

        if (roles.includes(UserRole.OWNER)) {
            query.innerJoin('location.owners', 'lo')
                .andWhere('lo.userId = :userId', { userId });
            if (locationId) {
                query.andWhere('location.id = :locationId', { locationId });
            }
        } else if (roles.includes('staff' as UserRole)) {
            query.innerJoin('staff_assignments', 'sa', 'sa.locationId = location.id')
                .andWhere('sa.staffId = :userId', { userId });
            if (locationId) {
                query.andWhere('location.id = :locationId', { locationId });
            }
        } else {
            query.andWhere('booking.userId = :userId', { userId });
        }

        // --- FILTROS COMUNES ---
        if (status && status !== 'all') {
            query.andWhere('booking.status = :status', { status });
        }

        // Ordenar por fecha de creación (lo más nuevo primero)
        query.orderBy('booking.createdAt', 'DESC');

        // Límite opcional
        if (limit) {
            query.take(limit);
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

    private async chargeExtension(booking: any, extraDays: number) {
        const pricePerDay = booking.location?.pricePerDay;
        if (!pricePerDay || extraDays <= 0) return null;
        const items = booking.items || { small: 0, medium: 0, large: 0 };
        const extraAmount = BookingCalculator.calculatePrice(pricePerDay, items, extraDays);
        const financials = BookingCalculator.calculateFinancials(extraAmount);

        const user = booking.user;
        let customerId = user?.stripeCustomerId;
        if (!customerId) return null;

        const paymentMethods = await this.stripe.paymentMethods.list({ customer: customerId, type: 'card' });
        const pm = paymentMethods.data?.[0];
        if (!pm) return null;

        const intent = await this.stripe.paymentIntents.create({
            amount: Math.round(extraAmount * 100),
            currency: 'usd',
            customer: customerId,
            payment_method: pm.id,
            confirm: true,
            off_session: true,
        });

        const tx = await this.transactionRepository.save({
            type: 'extension' as any,
            totalAmount: financials.totalToPay,
            taxAmount: financials.vatIncluded,
            serviceFee: financials.kipGoGross,
            ownerNet: financials.ownerNet,
            currency: 'CLP',
            status: intent.status === 'succeeded' ? TransactionStatus.SUCCEEDED : TransactionStatus.PENDING,
            paymentMethod: PaymentMethod.STRIPE,
            providerTransactionId: intent.id,
            booking: { id: booking.id },
            description: `Extra charge for ${extraDays} additional day(s)`,
        });

        return { extraDays, extraAmount: financials.totalToPay, transaction: tx };
    }

    async processQr(qrCode: string, ownerId: string) {
        const booking = await this.getBookingForOwner(qrCode, ownerId);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const locationName = booking.location?.name || 'Store';
        const clientUserId = booking.user?.id;

        switch (booking.status) {
            case 'confirmed':
                booking.status = 'in_storage';
                booking.checkedInAt = now;

                if (clientUserId) {
                    this.notificationsService.notifyCheckIn(clientUserId, booking.id, locationName);
                }

                if (booking.location?.owners) {
                    for (const owner of booking.location.owners) {
                        if (owner.user?.id) this.activityLogsService.logCollectionCompleted(owner.user.id, booking.location.id, `#${booking.id.slice(0, 4)} Check-in`, timeStr);
                    }
                }
                break;

            case 'in_storage': {
                const endDate = new Date(booking.endDate);
                const diffMs = now.getTime() - endDate.getTime();
                const GRACE_MS = 30 * 60 * 1000;
                let surcharge: any = null;

                if (diffMs > GRACE_MS) {
                    const extraDays = Math.max(1, Math.ceil((diffMs - GRACE_MS) / (24 * 60 * 60 * 1000)));
                    surcharge = await this.chargeExtension(booking, extraDays);
                    booking.endDate = new Date(endDate.getTime() + extraDays * 24 * 60 * 60 * 1000);
                    if (clientUserId) {
                        this.notificationsService.notifyExtensionCharged(clientUserId, booking.id, surcharge?.totalAmount || 0, extraDays);
                    }
                }

                booking.status = 'completed';
                booking.checkedOutAt = now;

                if (clientUserId) {
                    this.notificationsService.notifyCheckOut(clientUserId, booking.id, locationName);
                }

                if (booking.location?.owners) {
                    for (const owner of booking.location.owners) {
                        if (owner.user?.id) this.activityLogsService.logCollectionCompleted(owner.user.id, booking.location.id, `#${booking.id.slice(0, 4)}${surcharge ? ' +ext' : ''}`, timeStr);
                    }
                }
                break;
            }

            default:
                throw new BadRequestException(`La reserva no puede ser procesada (Estado: ${booking.status})`);
        }

        const saved = await this.bookingRepository.save(booking);
        return saved;
    }

    // bookings.service.ts

    async saveCheckInPhotos(bookingId: string, photos: string[], userId: string) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['location', 'location.owners', 'location.owners.user'],
        });
        if (!booking) throw new NotFoundException('Booking not found');

        const isOwner = booking.location?.owners?.some((o: any) => o.user?.id === userId);
        const isStaff = await this.isUserStaffForLocation(userId, booking.location?.id);
        if (!isOwner && !isStaff) throw new ForbiddenException('Not authorized');

        booking.checkInPhotos = photos;
        return this.bookingRepository.save(booking);
    }

    private async isUserStaffForLocation(userId: string, locationId: string): Promise<boolean> {
        const count = await this.bookingRepository.manager.count(StaffAssignment, {
            where: { staff: { id: userId }, location: { id: locationId } },
        });
        return count > 0;
    }

    async getBookingForOwner(qrCode: string, userId: string) {
        const booking = await this.bookingRepository.findOne({
            where: { qrCode },
            relations: [
                'user',
                'user.profile',
                'location',
                'location.owners',
                'location.owners.user'
            ],
        });

        if (!booking) {
            throw new NotFoundException('Reserva no encontrada');
        }

        const isOwner = booking.location.owners.some(
            (owner) => owner.user.id === userId
        );

        if (isOwner) return booking;

        const staffAssignment = await this.bookingRepository.manager
            .createQueryBuilder()
            .select()
            .from('staff_assignments', 'sa')
            .where('sa.staffId = :userId', { userId })
            .andWhere('sa.locationId = :locationId', { locationId: booking.location.id })
            .getRawOne();

        if (staffAssignment) return booking;

        throw new ForbiddenException('No tienes permiso para gestionar reservas de este local');
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

    private validateLocationSchedule(location: Location, start: Date, end: Date) {
        if (!location.workingHours || !Array.isArray(location.workingHours)) return;

        const CLT_OFFSET = -4 * 60; // Chile UTC-4 en minutos
        const toLocalMinutes = (date: Date) => {
            const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
            const localMinutes = utcMinutes + CLT_OFFSET;
            return ((localMinutes % 1440) + 1440) % 1440; // wrap to 0-1439
        };

        const checkTime = (date: Date, isStart: boolean) => {
            const dayOfWeek = date.getUTCDay();
            const dayConfig = location.workingHours.find((h: any) => h.day === dayOfWeek);

            if (!dayConfig) return;

            if (dayConfig.isClosed) {
                throw new BadRequestException(
                    `The store is closed on ${dayConfig.label || 'this day'}.`
                );
            }

            const timeToMinutes = (timeStr: string) => {
                const [hrs, mins] = timeStr.split(':').map(Number);
                return hrs * 60 + mins;
            };

            const currentMinutes = toLocalMinutes(date);
            const openMinutes = timeToMinutes(dayConfig.open);
            const closeMinutes = timeToMinutes(dayConfig.close);

            if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
                const type = isStart ? 'Drop-off' : 'Collection';
                const localHrs = Math.floor(currentMinutes / 60);
                const localMins = currentMinutes % 60;
                throw new BadRequestException(
                    `${type} time (${localHrs}:${String(localMins).padStart(2, '0')}) is outside store hours (${dayConfig.open} - ${dayConfig.close}).`
                );
            }
        };

        checkTime(start, true);
        checkTime(end, false);
    }

    // En bookings.service.ts

    async findOne(booking: Booking, userId: string) {
        const isOwner = booking.location.owners.some(o => o.user?.id === userId);

        const totalItemsCount =
            (booking.items?.small || 0) +
            (booking.items?.medium || 0) +
            (booking.items?.large || 0);

        const mainTransaction = booking.transactions?.find(t => t.type === 'booking');
        const extraTransactions = booking.transactions?.filter(t => t.type === 'extension') || [];

        const totalSurcharge = extraTransactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);

        return {
            id: booking.id,
            qrCode: booking.qrCode,
            status: booking.status,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            promoCode: booking.promoCode,
            discountAmount: booking.discountAmount,
            totalItems: totalItemsCount,
            items: booking.items,
            checkedInAt: booking.checkedInAt,
            checkedOutAt: booking.checkedOutAt,
            hasReview: booking.review?.length > 0,
            receipt: mainTransaction ? {
                total: Number(mainTransaction.totalAmount),
                tax: Number(mainTransaction.taxAmount),
                fee: Number(mainTransaction.serviceFee),
                net: Number(mainTransaction.ownerNet),
            } : null,
            surcharges: extraTransactions.map(t => ({
                total: Number(t.totalAmount),
                tax: Number(t.taxAmount),
                description: t.description || 'Extra charge',
                createdAt: t.createdAt,
            })),
            totalSurcharge,
            location: {
                id: booking.location.id,
                name: booking.location.name,
                address: booking.location.address,
                image: booking.location.imageUrl,
                latitude: booking.location.lat,
                longitude: booking.location.lng,
                pricePerDay: booking.location.pricePerDay,
            },
            customer: isOwner ? {
                name: `${booking.user.profile?.firstName || ''} ${booking.user.profile?.lastName || ''}`.trim(),
                email: booking.user.email,
            } : null
        };
    }
}