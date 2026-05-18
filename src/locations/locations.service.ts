import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Location } from './entities/location.entity'
import { LocationOwner } from './entities/location-owner.entity'
import { User } from 'src/users/entities/user.entity'
import { Booking } from 'src/bookings/entities/booking.entity'
import { Review } from 'src/reviews/entities/review.entity'
import { NotificationsService } from 'src/notifications/notifications.service'
import { MailService } from 'src/mail/mail.service'

interface NextPickup {
    rawDate: Date;
    time: string;
    customerName: string;
}

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private locationRepository: Repository<Location>,

        @InjectRepository(LocationOwner)
        private locationOwnerRepository: Repository<LocationOwner>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,

        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,

        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    // locations.service.ts
    async create(body: any, userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId as any });
        if (!user) throw new NotFoundException('User not found');

        const { MIN_PRICES } = require('../bookings/logic/booking.calculator').BookingCalculator;
        const smallPrice = parseFloat(body.smallPrice || '0');
        const mediumPrice = parseFloat(body.mediumPrice || '0');
        const largePrice = parseFloat(body.largePrice || '0');
        if (smallPrice < MIN_PRICES.small) throw new BadRequestException(`Small bag minimum price is $${MIN_PRICES.small}`);
        if (mediumPrice < MIN_PRICES.medium) throw new BadRequestException(`Medium bag minimum price is $${MIN_PRICES.medium}`);
        if (largePrice < MIN_PRICES.large) throw new BadRequestException(`Large bag minimum price is $${MIN_PRICES.large}`);

        // 1. Transformamos el objeto plano del Front al formato de la Entidad
        const locationData = {
            name: body.name,
            address: body.address,
            lat: parseFloat(body.lat),
            lng: parseFloat(body.lng),
            // Extraemos "Concepción" del address o usamos un default
            city: body.address.split(',')[1]?.trim() || 'Concepción',
            country: body.address.split(',').pop()?.trim() || 'Chile',
            description: body.description || '',
            imageUrl: body.imageUrl || null,

            // Agrupamos las capacidades
            capacity: {
                small: parseInt(body.smallCapacity || '0'),
                medium: parseInt(body.mediumCapacity || '0'),
                large: parseInt(body.largeCapacity || '0')
            },

            // Agrupamos los precios
            pricePerDay: {
                small: parseFloat(body.smallPrice || '0'),
                medium: parseFloat(body.mediumPrice || '0'),
                large: parseFloat(body.largePrice || '0')
            },

            // Horario por defecto si no viene en el body
            workingHours: body.workingHours || [
                { day: 1, label: 'Lunes', open: '09:00', close: '18:00', isClosed: false },
                { day: 2, label: 'Martes', open: '09:00', close: '18:00', isClosed: false },
                { day: 3, label: 'Miércoles', open: '09:00', close: '18:00', isClosed: false },
                { day: 4, label: 'Jueves', open: '09:00', close: '18:00', isClosed: false },
                { day: 5, label: 'Viernes', open: '09:00', close: '18:00', isClosed: false },
                { day: 6, label: 'Sábado', open: '10:00', close: '14:00', isClosed: true },
                { day: 0, label: 'Domingo', open: '00:00', close: '00:00', isClosed: true },
            ]
        };

        // 2. Guardamos la locación
        const location = this.locationRepository.create(locationData);
        const savedLocation = await this.locationRepository.save(location);

        // 3. Creamos el vínculo de dueño
        await this.locationOwnerRepository.save({
            user: user,
            location: savedLocation,
            isPrimary: true,
        });

        return savedLocation;
    }

    async findAll() {
        return this.locationRepository.find({ where: { status: 'active' } })
    }

    // Admin: todas las locaciones sin filtrar
    async findAllForAdmin() {
        return this.locationRepository.find({ relations: ['owners', 'owners.user', 'owners.user.profile'] })
    }

    async findOneForAdmin(id: string) {
        const location = await this.locationRepository.findOne({
            where: { id },
            relations: ['owners', 'owners.user', 'owners.user.profile'],
        });
        if (!location) throw new NotFoundException('Location not found');

        const owners = (location.owners || []).map((o) => ({
            name: o.user?.profile?.firstName || o.user?.email?.split('@')[0] || 'Unknown',
            email: o.user?.email,
            isPrimary: o.isPrimary,
        }));

        return { ...location, owners };
    }

    // Admin: actualizar status
    async updateStatus(id: string, status: 'pending' | 'active' | 'rejected') {
        const location = await this.locationRepository.findOne({ where: { id }, relations: ['owners', 'owners.user'] });
        if (!location) throw new NotFoundException('Location not found');
        location.status = status;
        const saved = await this.locationRepository.save(location);

        // Notificar al owner cuando la tienda es aprobada o rechazada
        if (status === 'active') {
            for (const owner of (location.owners || [])) {
                const ownerId = owner.user?.id;
                if (ownerId) {
                    this.notificationsService.notifyStoreApproved(ownerId, location.name);
                    const user = owner.user;
                    if (user?.email) {
                        this.mailService.sendStoreApprovedEmail(user.email, user.profile?.firstName || 'User', location.name);
                    }
                }
            }
        }

        return saved;
    }

    async findMyLocations(userId: string) {
        const relations = await this.locationOwnerRepository.find({
            where: { user: { id: userId } },
            relations: ['location'],
        })

        return relations.map((r) => r.location)
    }


    async findOne(id: string) {
        const location = await this.locationRepository.findOne({
            where: { id },
        });

        if (!location) throw new NotFoundException('Location not found');

        const occupied = await this.bookingRepository
            .createQueryBuilder('booking')
            .select("COALESCE(SUM((booking.items->>'small')::int), 0)", 'small')
            .addSelect("COALESCE(SUM((booking.items->>'medium')::int), 0)", 'medium')
            .addSelect("COALESCE(SUM((booking.items->>'large')::int), 0)", 'large')
            .where('booking.locationId = :locationId', { locationId: id })
            .andWhere('booking.status IN (:...statuses)', { statuses: ['in_storage', 'confirmed'] })
            .getRawOne();

        const availability = {
            small: Math.max(0, (location.capacity?.small || 0) - Number(occupied?.small || 0)),
            medium: Math.max(0, (location.capacity?.medium || 0) - Number(occupied?.medium || 0)),
            large: Math.max(0, (location.capacity?.large || 0) - Number(occupied?.large || 0)),
        };

        return {
            ...location,
            occupied: { small: Number(occupied?.small || 0), medium: Number(occupied?.medium || 0), large: Number(occupied?.large || 0) },
            availability,
        };
    }

    private calculateDistance(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number,
    ) {
        const toRad = (value: number) => (value * Math.PI) / 180
        const R = 6371

        const dLat = toRad(lat2 - lat1)
        const dLng = toRad(lng2 - lng1)

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        return R * c
    }

    async findNearby(
        lat: number,
        lng: number,
        radiusKm: number,
        startDate: Date,
        endDate: Date,
        search?: string,
        bounds?: { minLat?: number, maxLat?: number, minLng?: number, maxLng?: number }
    ) {
        const query = this.locationRepository.createQueryBuilder('location');

        // 1. Filtro por texto (Prioridad)
        if (search) {
            query.andWhere('(location.name ILIKE :search OR location.address ILIKE :search)', { search: `%${search}%` });
        }
        // 2. Filtro por Bounding Box (Solo si no hay búsqueda activa para no restringir)
        else if (bounds && bounds.minLat && bounds.maxLat && bounds.minLng && bounds.maxLng) {
            query.andWhere('location.lat BETWEEN :minLat AND :maxLat', { minLat: bounds.minLat, maxLat: bounds.maxLat })
                .andWhere('location.lng BETWEEN :minLng AND :maxLng', { minLng: bounds.minLng, maxLng: bounds.maxLng });
        }

        // 3. Límite de resultados (Ahorro de costos y UX)
        query.take(30);

        const locations = await query.getMany();

        const results = await Promise.all(
            locations.map(async (loc) => {
                const distance = this.calculateDistance(
                    lat,
                    lng,
                    Number(loc.lat),
                    Number(loc.lng),
                )

                const availability =
                    (await this.getAvailability(loc.id, startDate, endDate)) ?? {
                        small: 0,
                        medium: 0,
                        large: 0,
                    }

                const avgRatingResult = await this.reviewRepository
                    .createQueryBuilder('review')
                    .select('AVG(review.rating)', 'avg')
                    .where('review.locationId = :locationId', { locationId: loc.id })
                    .getRawOne()
                const averageRating = avgRatingResult?.avg ? Math.round(parseFloat(avgRatingResult.avg) * 10) / 10 : null

                return {
                    ...loc,
                    distance,
                    availability,
                    averageRating,
                }
            }),
        )

        return results
            .filter((loc) => {
                const a = loc.availability

                return (
                    loc.distance <= radiusKm &&
                    (a.small > 0 || a.medium > 0 || a.large > 0)
                )
            })
            .sort((a, b) => a.distance - b.distance)
    }

    async validateOwnership(id: string, userId: string): Promise<Location> {
        const location = await this.locationRepository.findOne({
            where: { id },
            relations: ['owners', 'owners.user']
        });

        if (!location) throw new NotFoundException('Location not found');

        const isOwner = location.owners.some(o => o.user.id === userId);
        if (!isOwner) throw new ForbiddenException('You do not own this location');

        return location; // 👈 Retornamos la entidad
    }

    async getAvailability(
        locationId: string,
        startDate: Date,
        endDate: Date,
    ) {
        const location = await this.locationRepository.findOne({
            where: { id: locationId },
        })

        if (!location) return null

        const bookings = await this.bookingRepository
            .createQueryBuilder('booking')
            .where('booking.locationId = :locationId', { locationId })
            .andWhere(
                `(booking.startDate <= :endDate AND booking.endDate >= :startDate)`,
                { startDate, endDate },
            )
            .andWhere('booking.status = :status', {
                status: 'confirmed',
            })
            .getMany()

        const used = { small: 0, medium: 0, large: 0 }

        bookings.forEach((b) => {
            used.small += b.items?.small || 0
            used.medium += b.items?.medium || 0
            used.large += b.items?.large || 0
        })

        return {
            small: Math.max(0, location.capacity.small - used.small),
            medium: Math.max(0, location.capacity.medium - used.medium),
            large: Math.max(0, location.capacity.large - used.large),
        }
    }

    private calculateStatsFromLocation(loc: any) {
        let todayRevenue = 0, yesterdayRevenue = 0, activeBookingsCount = 0;
        let pickupsToday = 0, dropoffsToday = 0;
        let nextPickup: any = null, nextDropoff: any = null;

        const occupancy = {
            small: { current: 0, total: loc.capacity?.small || 0 },
            medium: { current: 0, total: loc.capacity?.medium || 0 },
            large: { current: 0, total: loc.capacity?.large || 0 }
        };

        const now = new Date();
        const getZeroDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const todayTimestamp = getZeroDate(now);
        const yesterdayTimestamp = getZeroDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

        (loc.bookings || []).forEach((b: any) => {
            const startDate = new Date(b.startDate);
            const endDate = new Date(b.endDate);
            const startTimestamp = getZeroDate(startDate);
            const endTimestamp = getZeroDate(endDate);
            const customerName = b.user?.profile?.firstName || 'Guest';
            const itemsDetail = `${b.items?.small || 0}S, ${b.items?.medium || 0}M, ${b.items?.large || 0}L`;

            if (['confirmed', 'in_storage', 'completed'].includes(b.status)) {
                const createdAtTimestamp = getZeroDate(new Date(b.createdAt));
                if (createdAtTimestamp === todayTimestamp) todayRevenue += Number(b.totalPrice || 0);
                if (createdAtTimestamp === yesterdayTimestamp) yesterdayRevenue += Number(b.totalPrice || 0);
            }

            if (['confirmed', 'in_storage'].includes(b.status)) {
                activeBookingsCount++;
                occupancy.small.current += b.items?.small || 0;
                occupancy.medium.current += b.items?.medium || 0;
                occupancy.large.current += b.items?.large || 0;
            }

            if (startTimestamp === todayTimestamp && b.status === 'confirmed') {
                dropoffsToday++;
                if (startDate > now && (!nextDropoff || startDate < nextDropoff.rawDate)) {
                    nextDropoff = { rawDate: startDate, time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }), customerName, itemsDetail };
                }
            }

            if (endTimestamp === todayTimestamp && b.status === 'in_storage') {
                pickupsToday++;
                if (endDate > now && (!nextPickup || endDate < nextPickup.rawDate)) {
                    nextPickup = { rawDate: endDate, time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }), customerName, itemsDetail };
                }
            }
        });

        const pct = (curr: number, tot: number) => tot > 0 ? Math.min(Math.round((curr / tot) * 100), 100) : 0;

        return {
            storeInfo: { id: loc.id, name: loc.name, status: 'ACTIVE' },
            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
                percentageIncrease: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : (todayRevenue > 0 ? 100 : 0)
            },
            bookings: { activeCount: activeBookingsCount, liveStatus: true },
            dropoffs: { totalToday: dropoffsToday, nextDropoff: nextDropoff ? { time: nextDropoff.time, customerName: nextDropoff.customerName, itemsDetail: nextDropoff.itemsDetail } : null },
            pickups: { totalToday: pickupsToday, nextPickup: nextPickup ? { time: nextPickup.time, customerName: nextPickup.customerName, itemsDetail: nextPickup.itemsDetail } : null },
            occupancy: [
                { label: 'Small Bags', percentage: pct(occupancy.small.current, occupancy.small.total), color: '#0A0E5E' },
                { label: 'Medium Bags', percentage: pct(occupancy.medium.current, occupancy.medium.total), color: '#6366F1' },
                { label: 'Large Bags', percentage: pct(occupancy.large.current, occupancy.large.total), color: '#FF6D00' }
            ]
        };
    }

    async getDashboardStatsByStoreId(locationId: string) {
        const loc = await this.locationRepository.findOne({
            where: { id: locationId as any },
            relations: ['bookings', 'bookings.user', 'bookings.user.profile'],
        });
        if (!loc) return null;
        return this.calculateStatsFromLocation(loc);
    }

    async getDashboardStatsByOwnerByStore(ownerId: string, locationId?: string) {
        const locationOwners = await this.locationOwnerRepository.find({
            where: { user: { id: ownerId } },
            relations: ['location', 'location.bookings', 'location.bookings.user', 'location.bookings.user.profile'],
        });

        if (locationOwners.length === 0) return null;

        let selectedLocOwner = locationId
            ? locationOwners.find(lo => lo.location.id === locationId)
            : locationOwners[0];

        const loc = selectedLocOwner ? selectedLocOwner.location : locationOwners[0].location;
        return this.calculateStatsFromLocation(loc);
    }

    async update(id: string, data: Partial<Location>, userId: string) {
        // 1. Validar que el local existe y pertenece al usuario
        const location = await this.validateOwnership(id, userId);

        // 2. Normalizar la moneda si viene en el body
        if (data.currency) {
            data.currency = data.currency.toUpperCase();
            // Opcional: Validar que sea un código ISO válido (CLP, USD, etc.)
        }

        // 3. Fusionar los datos (Deep Merge)
        // Esto asegura que si solo editas 'small', 'medium' y 'large' se mantengan.
        const updatedLocation = this.locationRepository.merge(location, data);

        // 4. Guardar (save dispara validaciones y hooks)
        return await this.locationRepository.save(updatedLocation);
    }

    async remove(id: string, userId: string) {
        await this.validateOwnership(id, userId);

        // 1. Buscamos la entidad pura directamente del repositorio
        // No usamos this.findOne(id) porque ese retorna el objeto con availability
        const location = await this.locationRepository.findOne({ where: { id } });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        // 2. Ahora sí podemos remover la entidad
        await this.locationRepository.remove(location);

        return { message: 'Location deleted' };
    }
}