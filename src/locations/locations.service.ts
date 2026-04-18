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
            relations: ['owners', 'owners.user'],
        })

        if (!location) {
            throw new NotFoundException('Location not found')
        }

        return location
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

    async getStatsByOwner(ownerId: string) {
        const locationOwners = await this.locationOwnerRepository.find({
            where: { user: { id: ownerId } },
            relations: ['location', 'location.bookings'],
        });
    
        let totalSlots = 0;
        let activeItems = 0;
        let totalRevenue = 0;
    
        locationOwners.forEach((lo) => {
            const loc = lo.location;
            totalSlots += (loc.capacity.small + loc.capacity.medium + loc.capacity.large);
    
            // Consideramos ocupado lo que está Confirmado y lo que ya está En Bodega
            const occupiedBookings = loc.bookings.filter(b => 
                ['confirmed', 'in_storage'].includes(b.status)
            );
    
            occupiedBookings.forEach((booking) => {
                activeItems += (booking.items.small + booking.items.medium + booking.items.large);
            });
    
            // El ingreso solo sumamos lo Confirmado, En Bodega o ya Completado
            const revenueBookings = loc.bookings.filter(b => 
                ['confirmed', 'in_storage', 'completed'].includes(b.status)
            );
    
            revenueBookings.forEach((booking) => {
                totalRevenue += Number(booking.totalPrice);
            });
        });
    
        return {
            activeItems,
            totalSlots,
            percentage: totalSlots > 0 ? Math.round((activeItems / totalSlots) * 100) : 0,
            revenue: totalRevenue,
        };
    }

    async update(id: string, data: Partial<Location>, userId: string) {
        await this.validateOwnership(id, userId)

        await this.locationRepository.update(id, data)

        return this.findOne(id)
    }

    async remove(id: string, userId: string) {
        await this.validateOwnership(id, userId)

        const location = await this.findOne(id)

        await this.locationRepository.remove(location)

        return { message: 'Location deleted' }
    }
}