import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Location } from './entities/location.entity'
import { LocationOwner } from './entities/location-owner.entity'
import { User } from 'src/users/entities/user.entity'
import { Booking } from 'src/bookings/entities/booking.entity'

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
    ) { }

    // locations.service.ts
    async create(body: any, userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId as any });
        if (!user) throw new NotFoundException('User not found');

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
            }
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
        return this.locationRepository.find()
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
            relations: ['bookings'],
        });

        if (!location) throw new NotFoundException('Location not found');

        // 1. Filtrar bookings activos
        // Usamos toLowerCase() para evitar errores de tipeo si vienen de la DB distintos
        const activeBookings = location.bookings.filter(
            b => b.status.toLowerCase() === 'in_storage' || b.status.toLowerCase() === 'confirmed'
        );

        // 2. Sumar ocupación con tipado explícito
        const occupied = activeBookings.reduce((acc, booking) => {
            acc.small += Number(booking.items?.small || 0);
            acc.medium += Number(booking.items?.medium || 0);
            acc.large += Number(booking.items?.large || 0);
            return acc;
        }, { small: 0, medium: 0, large: 0 });

        // 3. Calcular disponibilidad
        const availability = {
            small: Math.max(0, location.capacity.small - occupied.small),
            medium: Math.max(0, location.capacity.medium - occupied.medium),
            large: Math.max(0, location.capacity.large - occupied.large),
        };

        // 4. Retorno Limpio (IMPORTANTE: Quitamos 'bookings' del spread)
        const { bookings, ...dataWithoutBookings } = location;

        return {
            ...dataWithoutBookings,
            occupied,
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
    ) {
        const locations = await this.locationRepository.find()

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

                return {
                    ...loc,
                    distance,
                    availability,
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

    async validateOwnership(locationId: string, userId: string) {
        const ownership = await this.locationOwnerRepository.findOne({
            where: {
                location: { id: locationId },
                user: { id: userId },
            },
        })

        if (!ownership) {
            throw new BadRequestException(
                'You are not the owner of this location',
            )
        }
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

    async getDashboardStatsByOwnerByStore(ownerId: string, locationId?: string) {
        // 1. Buscamos todas las locaciones del dueño
        // IMPORTANTE: He añadido 'location.bookings.user' en las relations para que b.user?.name funcione
        const locationOwners = await this.locationOwnerRepository.find({
            where: { user: { id: ownerId } },
            relations: ['location', 'location.bookings', 'location.bookings.user'],
        });

        if (locationOwners.length === 0) return null;

        // 2. Selección de la tienda: La solicitada o la primera por defecto
        let selectedLocOwner;
        if (locationId) {
            selectedLocOwner = locationOwners.find(lo => lo.location.id === locationId);
        }

        // Si no se pasó ID o no se encontró el ID solicitado, usamos el primero
        const loc = selectedLocOwner ? selectedLocOwner.location : locationOwners[0].location;

        // Inicializamos acumuladores
        let todayRevenue = 0;
        let yesterdayRevenue = 0;
        let activeBookingsCount = 0;

        const occupancy = {
            small: { current: 0, total: loc.capacity.small || 0 },
            medium: { current: 0, total: loc.capacity.medium || 0 },
            large: { current: 0, total: loc.capacity.large || 0 }
        };

        // Tipamos explícitamente para evitar el error 'never'
        let nextPickup: NextPickup | null = null;
        let pickupsToday = 0;

        const now = new Date();
        // Helper para comparar fechas sin horas
        const getZeroDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

        const todayTimestamp = getZeroDate(now);
        const yesterdayTimestamp = getZeroDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

        // 3. Procesamos los bookings de la tienda seleccionada
        loc.bookings.forEach((b) => {
            const createdAtDate = new Date(b.createdAt);
            const pickupDate = new Date(b.pickupDate);
            const bookingDateTimestamp = getZeroDate(createdAtDate);
            const pickupDateTimestamp = getZeroDate(pickupDate);

            // --- Revenue (Hoy vs Ayer) ---
            if (['confirmed', 'in_storage', 'completed'].includes(b.status)) {
                if (bookingDateTimestamp === todayTimestamp) todayRevenue += Number(b.totalPrice || 0);
                if (bookingDateTimestamp === yesterdayTimestamp) yesterdayRevenue += Number(b.totalPrice || 0);
            }

            // --- Ocupación Actual ---
            if (['confirmed', 'in_storage'].includes(b.status)) {
                activeBookingsCount++;
                occupancy.small.current += b.items?.small || 0;
                occupancy.medium.current += b.items?.medium || 0;
                occupancy.large.current += b.items?.large || 0;
            }

            // --- Próximos Pickups de hoy ---
            if (pickupDateTimestamp === todayTimestamp && b.status === 'in_storage') {
                pickupsToday++;

                if (pickupDate > now && (!nextPickup || pickupDate < nextPickup.rawDate)) {
                    nextPickup = {
                        rawDate: pickupDate,
                        time: pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        customerName: b.user?.name || 'Guest'
                    };
                }
            }
        });

        const calculatePct = (curr: number, tot: number) => tot > 0 ? Math.min(Math.round((curr / tot) * 100), 100) : 0;

        // 4. Formateamos la respuesta para el nuevo diseño
        return {
            storeInfo: {
                id: loc.id,
                name: loc.name,
                status: 'ACTIVE'
            },
            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
                percentageIncrease: yesterdayRevenue > 0
                    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
                    : (todayRevenue > 0 ? 100 : 0)
            },
            bookings: {
                activeCount: activeBookingsCount,
                liveStatus: true
            },
            pickups: {
                totalToday: pickupsToday,
                nextPickup: nextPickup
                    ? {
                        time: (nextPickup as NextPickup).time,
                        customerName: (nextPickup as NextPickup).customerName
                    }
                    : null
            },
            occupancy: [
                { label: 'Small Bags', percentage: calculatePct(occupancy.small.current, occupancy.small.total), color: '#0A0E5E' },
                { label: 'Medium Bags', percentage: calculatePct(occupancy.medium.current, occupancy.medium.total), color: '#6366F1' },
                { label: 'Large Bags', percentage: calculatePct(occupancy.large.current, occupancy.large.total), color: '#FF6D00' }
            ]
        };
    }

    async update(id: string, data: Partial<Location>, userId: string) {
        await this.validateOwnership(id, userId)

        await this.locationRepository.update(id, data)

        return this.findOne(id)
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