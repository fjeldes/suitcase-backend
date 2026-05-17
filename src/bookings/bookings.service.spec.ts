import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

const mockStripeInstance = {
  paymentMethods: { list: jest.fn().mockResolvedValue({ data: [{ id: 'pm_123' }] }) },
  paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_123', status: 'succeeded' }) },
}

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

import { BookingsService } from './bookings.service'
import { Booking } from './entities/booking.entity'
import { Location } from 'src/locations/entities/location.entity'
import { User } from 'src/users/entities/user.entity'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { Transaction } from 'src/transactions/entities/transaction.entity'
import { NotificationsService } from 'src/notifications/notifications.service'
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service'
import { PaymentsService } from 'src/payments/payments.service'
import { PromosService } from 'src/promos/promos.service'

describe('BookingsService', () => {
  let service: BookingsService
  let bookingRepository: jest.Mocked<Repository<Booking>>
  let locationRepository: jest.Mocked<Repository<Location>>
  let userRepository: jest.Mocked<Repository<User>>
  let locationOwnerRepository: jest.Mocked<Repository<LocationOwner>>
  let transactionRepository: jest.Mocked<Repository<Transaction>>
  let activityLogsService: jest.Mocked<ActivityLogsService>

  const mockLocation = {
    id: 'loc-1',
    name: 'Test Store',
    address: '123 Main St',
    lat: 36.8,
    lng: 73.0,
    city: 'Concepción',
    country: 'Chile',
    currency: 'CLP',
    capacity: { small: 10, medium: 5, large: 3 },
    pricePerDay: { small: 5, medium: 8, large: 12 },
    isActive: true,
    workingHours: [
      { day: 1, label: 'Monday', open: '09:00', close: '18:00', isClosed: false },
    ],
    owners: [{ user: { id: 'owner-1' } }],
  } as Location

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    stripeCustomerId: 'cus_123',
    profile: { firstName: 'Test', lastName: 'User' },
  } as User

  const mockBooking = {
    id: 'booking-1',
    qrCode: 'STC-ABC123',
    startDate: new Date('2025-06-01T10:00:00'),
    endDate: new Date('2025-06-02T10:00:00'),
    totalPrice: 5000,
    days: 1,
    status: 'confirmed',
    items: { small: 1, medium: 0, large: 0 },
    checkedInAt: null,
    checkedOutAt: null,
    user: mockUser,
    location: mockLocation,
    review: [],
    transactions: [],
  } as any

  beforeEach(async () => {
    bookingRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { createQueryBuilder: jest.fn() } as any,
    } as any

    locationRepository = {
      findOne: jest.fn(),
    } as any

    userRepository = {
      findOne: jest.fn(),
    } as any

    locationOwnerRepository = {
      findOne: jest.fn(),
    } as any

    transactionRepository = {
      save: jest.fn(),
    } as any

    activityLogsService = {
      logNewBooking: jest.fn().mockResolvedValue(undefined),
      logBookingCancelled: jest.fn().mockResolvedValue(undefined),
      logCollectionCompleted: jest.fn().mockResolvedValue(undefined),
    } as any

    const notificationsService = {
      notifyBookingCreated: jest.fn().mockResolvedValue(undefined),
      notifyNewBookingForOwner: jest.fn().mockResolvedValue(undefined),
      notifyCheckIn: jest.fn().mockResolvedValue(undefined),
      notifyCheckOut: jest.fn().mockResolvedValue(undefined),
      notifyBookingCancelled: jest.fn().mockResolvedValue(undefined),
      notifyExtensionCharged: jest.fn().mockResolvedValue(undefined),
    } as any

    const paymentsService = {
      createPaymentIntent: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepository },
        { provide: getRepositoryToken(Location), useValue: locationRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(LocationOwner), useValue: locationOwnerRepository },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepository },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ActivityLogsService, useValue: activityLogsService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: PromosService, useValue: { validate: jest.fn(), incrementUses: jest.fn() } },
      ],
    }).compile()

    service = module.get<BookingsService>(BookingsService)
  })

  describe('create', () => {
    const dto = {
      locationId: 'loc-1',
      startDate: '2025-06-01T10:00:00',
      endDate: '2025-06-02T10:00:00',
      items: { small: 1, medium: 0, large: 0 },
    }

    it('creates a booking and processes payment', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      bookingRepository.findOne.mockResolvedValue(null)
      bookingRepository.find.mockResolvedValue([])
      userRepository.findOne.mockResolvedValue(mockUser)
      bookingRepository.create.mockReturnValue(mockBooking)
      bookingRepository.save.mockResolvedValue(mockBooking)
      transactionRepository.save.mockResolvedValue({ id: 'tx-1' } as any)

      const result = await service.create(dto, 'user-1')
      expect(result).toEqual(mockBooking)
      expect(bookingRepository.save).toHaveBeenCalled()
    })

    it('throws on invalid date range', async () => {
      const badDto = { ...dto, startDate: '2025-06-02T10:00:00', endDate: '2025-06-01T10:00:00' }
      await expect(service.create(badDto, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null)
      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws if user already has an active booking', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      bookingRepository.findOne.mockResolvedValue(mockBooking)
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws if no space available', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      bookingRepository.findOne.mockResolvedValue(null)
      bookingRepository.find.mockResolvedValue([{ items: { small: 10, medium: 5, large: 3 } }] as any)

      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('preview', () => {
    const dto = {
      locationId: 'loc-1',
      startDate: '2025-06-01T10:00:00',
      endDate: '2025-06-02T10:00:00',
      items: { small: 1, medium: 1, large: 0 },
    }

    it('returns price preview with availability', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      bookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await service.preview(dto, 'user-1')
      expect(result).toHaveProperty('totalPrice')
      expect(result).toHaveProperty('availability')
      expect(result).toHaveProperty('breakdown')
      expect(result.status).toBe('confirmed')
    })

    it('throws on invalid date range', async () => {
      const badDto = { ...dto, startDate: '2025-06-02T10:00:00', endDate: '2025-06-01T10:00:00' }
      await expect(service.preview(badDto, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null)
      await expect(service.preview(dto, 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws if no items requested', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      const noItemsDto = { ...dto, items: { small: 0, medium: 0, large: 0 } }
      await expect(service.preview(noItemsDto, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('sets status to pending if exceeds capacity', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation)
      bookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ items: { small: 10, medium: 5, large: 3 } }]),
      } as any)

      const result = await service.preview({ ...dto, items: { small: 1, medium: 0, large: 0 } }, 'user-1')
      expect(result.status).toBe('pending')
    })
  })

  describe('cancel', () => {
    it('cancels a booking the user owns', async () => {
      const cancelBooking = {
        ...mockBooking,
        user: { id: 'user-1' },
        location: { ...mockLocation, owners: [{ user: { id: 'owner-1' } }] },
      }
      bookingRepository.findOne.mockResolvedValue(cancelBooking)
      bookingRepository.save.mockResolvedValue({ ...cancelBooking, status: 'cancelled' })

      const result = await service.cancel('booking-1', 'user-1')
      expect(result.status).toBe('cancelled')
    })

    it('throws if booking not found', async () => {
      bookingRepository.findOne.mockResolvedValue(null)
      await expect(service.cancel('unknown', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws if not the booking owner', async () => {
      bookingRepository.findOne.mockResolvedValue({ ...mockBooking, user: { id: 'other-user' } })
      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws if already cancelled', async () => {
      bookingRepository.findOne.mockResolvedValue({ ...mockBooking, user: { id: 'user-1' }, status: 'cancelled' })
      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    const activeBooking = {
      ...mockBooking,
      user: { id: 'user-1' },
      status: 'confirmed',
      location: { ...mockLocation },
    }

    it('updates booking dates and items', async () => {
      bookingRepository.findOne.mockResolvedValue(activeBooking)
      bookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any)
      bookingRepository.save.mockResolvedValue(activeBooking)

      const dto = { startDate: '2025-06-02T10:00:00', endDate: '2025-06-03T10:00:00', items: { small: 2 } }
      const result = await service.update('booking-1', dto as any, 'user-1')
      expect(result).toBeDefined()
    })

    it('throws if booking not found', async () => {
      bookingRepository.findOne.mockResolvedValue(null)
      await expect(service.update('unknown', {} as any, 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws if not the booking owner', async () => {
      bookingRepository.findOne.mockResolvedValue({ ...activeBooking, user: { id: 'other' } })
      await expect(service.update('booking-1', {} as any, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws if booking is cancelled', async () => {
      bookingRepository.findOne.mockResolvedValue({ ...activeBooking, status: 'cancelled' })
      await expect(service.update('booking-1', {} as any, 'user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('findByLocation', () => {
    it('returns bookings for location if owner', async () => {
      locationOwnerRepository.findOne.mockResolvedValue({ id: 'lo-1' } as any)
      bookingRepository.find.mockResolvedValue([mockBooking])

      const result = await service.findByLocation('loc-1', 'owner-1')
      expect(result).toHaveLength(1)
    })

    it('throws if not owner', async () => {
      locationOwnerRepository.findOne.mockResolvedValue(null)
      await expect(service.findByLocation('loc-1', 'not-owner')).rejects.toThrow(BadRequestException)
    })
  })

  describe('processQr', () => {
    it('check-in: changes status from confirmed to in_storage', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: 'confirmed',
        location: { ...mockLocation, owners: [{ user: { id: 'owner-1' } }] },
      }
      jest.spyOn(service as any, 'getBookingForOwner').mockResolvedValue(confirmedBooking)
      bookingRepository.save.mockResolvedValue({ ...confirmedBooking, status: 'in_storage' })

      const result = await service.processQr('STC-ABC123', 'owner-1')
      expect(result.status).toBe('in_storage')
      expect(result.checkedInAt).toBeDefined()
    })

    it('check-out: changes status from in_storage to completed', async () => {
      const storedBooking = {
        ...mockBooking,
        status: 'in_storage',
        endDate: new Date(Date.now() - 60 * 60 * 1000),
        user: { ...mockUser, stripeCustomerId: 'cus_123' },
        location: { ...mockLocation, owners: [{ user: { id: 'owner-1' } }] },
      }
      jest.spyOn(service as any, 'getBookingForOwner').mockResolvedValue(storedBooking)
      bookingRepository.save.mockResolvedValue({ ...storedBooking, status: 'completed' })

      const result = await service.processQr('STC-ABC123', 'owner-1')
      expect(result.status).toBe('completed')
      expect(result.checkedOutAt).toBeDefined()
    })

    it('throws for invalid QR', async () => {
      jest.spyOn(service as any, 'getBookingForOwner').mockRejectedValue(new NotFoundException())
      await expect(service.processQr('INVALID', 'owner-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getBookingForOwner', () => {
    it('returns booking if user is owner', async () => {
      const ownedBooking = {
        ...mockBooking,
        location: { ...mockLocation, owners: [{ user: { id: 'owner-1' } }] },
      }
      bookingRepository.findOne.mockResolvedValue(ownedBooking)

      const result = await (service as any).getBookingForOwner('STC-123', 'owner-1')
      expect(result).toBeDefined()
    })

    it('throws if user is not owner and not staff', async () => {
      bookingRepository.findOne.mockResolvedValue({
        ...mockBooking,
        location: { ...mockLocation, owners: [{ user: { id: 'owner-1' } }] },
      })

      ;(bookingRepository.manager.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      } as any)

      await expect((service as any).getBookingForOwner('STC-123', 'stranger')).rejects.toThrow(ForbiddenException)
    })
  })
})
