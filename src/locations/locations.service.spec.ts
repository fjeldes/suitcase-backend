import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { LocationsService } from './locations.service'
import { Location } from './entities/location.entity'
import { LocationOwner } from './entities/location-owner.entity'
import { User } from 'src/users/entities/user.entity'
import { Booking } from 'src/bookings/entities/booking.entity'
import { NotificationsService } from 'src/notifications/notifications.service'
import { MailService } from 'src/mail/mail.service'

describe('LocationsService', () => {
  let service: LocationsService
  let locationRepository: jest.Mocked<Repository<Location>>
  let locationOwnerRepository: jest.Mocked<Repository<LocationOwner>>
  let userRepository: jest.Mocked<Repository<User>>
  let bookingRepository: jest.Mocked<Repository<Booking>>

  const mockLocation = {
    id: 'loc-1',
    name: 'Test Store',
    description: 'A test store',
    address: '123 Main St, Concepción, Chile',
    lat: 36.8,
    lng: 73.0,
    city: 'Concepción',
    country: 'Chile',
    currency: 'CLP',
    capacity: { small: 10, medium: 5, large: 3 },
    pricePerDay: { small: 5, medium: 8, large: 12 },
    isActive: true,
    imageUrl: null,
    workingHours: null,
    owners: [{ id: 'lo-1', user: { id: 'owner-1' }, isPrimary: true }],
    bookings: [],
    reviews: [],
  } as any

  beforeEach(async () => {
    locationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any

    locationOwnerRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any

    userRepository = {
      findOneBy: jest.fn(),
    } as any

    bookingRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any

    const notificationsService = {} as NotificationsService
    const mailService = {} as MailService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locationRepository },
        { provide: getRepositoryToken(LocationOwner), useValue: locationOwnerRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingRepository },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile()

    service = module.get<LocationsService>(LocationsService)
  })

  describe('create', () => {
    const body = {
      name: 'New Store',
      address: '456 Oak Ave, Santiago, Chile',
      lat: '33.45',
      lng: '70.65',
      smallCapacity: '5',
      mediumCapacity: '3',
      largeCapacity: '2',
      smallPrice: '6',
      mediumPrice: '10',
      largePrice: '15',
      description: 'A new store',
    }

    it('creates a location with owner link', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 'owner-1', email: 'owner@test.com' } as any)
      locationRepository.create.mockReturnValue({ id: 'new-loc' } as any)
      locationRepository.save.mockResolvedValue({ id: 'new-loc', ...body } as any)
      locationOwnerRepository.save.mockResolvedValue({ id: 'lo-1' } as any)

      const result = await service.create(body, 'owner-1')
      expect(result).toBeDefined()
      expect(locationRepository.create).toHaveBeenCalled()
      expect(locationRepository.save).toHaveBeenCalled()
      expect(locationOwnerRepository.save).toHaveBeenCalled()
    })

    it('throws if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null)
      await expect(service.create(body, 'unknown')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('returns all locations', async () => {
      locationRepository.find.mockResolvedValue([mockLocation])
      const result = await service.findAll()
      expect(result).toHaveLength(1)
    })
  })

  describe('findMyLocations', () => {
    it('returns locations owned by user', async () => {
      locationOwnerRepository.find.mockResolvedValue([
        { id: 'lo-1', location: mockLocation },
      ] as any)

      const result = await service.findMyLocations('owner-1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('loc-1')
    })

    it('returns empty array if no locations', async () => {
      locationOwnerRepository.find.mockResolvedValue([])
      const result = await service.findMyLocations('owner-1')
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('returns location with availability', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation as any)

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ small: 3, medium: 1, large: 0 }),
      }
      bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      const result = await service.findOne('loc-1')
      expect(result).toBeDefined()
      expect(result.occupied).toEqual({ small: 3, medium: 1, large: 0 })
      expect(result.availability).toEqual({ small: 7, medium: 4, large: 3 })
    })

    it('throws if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null)
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException)
    })
  })

  describe('validateOwnership', () => {
    it('returns location if user is owner', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      const result = await service.validateOwnership('loc-1', 'owner-1')
      expect(result).toEqual(mockLocation)
    })

    it('throws if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null)
      await expect(service.validateOwnership('unknown', 'owner-1')).rejects.toThrow(NotFoundException)
    })

    it('throws if user is not owner', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      await expect(service.validateOwnership('loc-1', 'not-owner')).rejects.toThrow(ForbiddenException)
    })
  })

  describe('update', () => {
    it('updates location fields', async () => {
      const updateData = { name: 'Updated Store', currency: 'usd' }
      jest.spyOn(service as any, 'validateOwnership').mockResolvedValue(mockLocation)
      locationRepository.merge.mockReturnValue({ ...mockLocation, name: 'Updated Store', currency: 'USD' } as any)
      locationRepository.save.mockResolvedValue({ ...mockLocation, name: 'Updated Store', currency: 'USD' })

      const result = await service.update('loc-1', updateData as any, 'owner-1')
      expect(result.name).toBe('Updated Store')
      expect(result.currency).toBe('USD')
    })
  })

  describe('remove', () => {
    it('deletes location if owner', async () => {
      jest.spyOn(service as any, 'validateOwnership').mockResolvedValue(mockLocation)
      locationRepository.findOne.mockResolvedValue(mockLocation)
      locationRepository.remove.mockResolvedValue(mockLocation)

      const result = await service.remove('loc-1', 'owner-1')
      expect(result).toEqual({ message: 'Location deleted' })
    })
  })

  describe('getAvailability', () => {
    it('returns available capacity', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { items: { small: 3, medium: 2, large: 1 } },
        ]),
      }
      bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      const result = await service.getAvailability(
        'loc-1',
        new Date('2025-06-01'),
        new Date('2025-06-02'),
      )
      expect(result).toEqual({ small: 7, medium: 3, large: 2 })
    })

    it('returns null if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null)
      const result = await service.getAvailability('unknown', new Date(), new Date())
      expect(result).toBeNull()
    })
  })

  describe('findNearby', () => {
    it('returns nearby locations with availability sorted by distance', async () => {
      const loc1 = { ...mockLocation, id: 'loc-1' }
      const loc2 = { ...mockLocation, id: 'loc-2', name: 'Far Store', lat: 36.81, lng: 73.02 }
      ;(loc2 as any).lat = 36.81
      ;(loc2 as any).lng = 73.02

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([loc1, loc2]),
      }
      locationRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)
      locationRepository.findOne.mockResolvedValue(mockLocation)

      const bookingQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }
      bookingRepository.createQueryBuilder.mockReturnValue(bookingQb as any)

      const result = await service.findNearby(
        36.8, 73.0, 50,
        new Date('2025-06-01'), new Date('2025-06-02'),
      )

      expect(result.length).toEqual(2)
      expect(result[0].distance).toBeLessThan(result[1].distance)
    })
  })
})
