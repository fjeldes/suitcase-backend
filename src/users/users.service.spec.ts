import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'

import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { Role } from './entities/role.entity'
import { Profile } from './entities/profile.entity'
import { UserRole } from './entities/user-role.entity'
import { StorageService } from 'src/storage/storage.service'

describe('UsersService', () => {
  let service: UsersService
  let userRepository: jest.Mocked<Repository<User>>
  let profileRepository: jest.Mocked<Repository<Profile>>
  let storageService: jest.Mocked<StorageService>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$hashed',
    isActive: true,
    isEmailVerified: true,
    profile: { id: 'profile-1', firstName: 'Test', lastName: 'User', avatar: null },
    roles: [{ id: 'ur-1', role: { id: 'role-1', name: 'client' } }],
  } as any

  beforeEach(async () => {
    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any

    const roleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any

    profileRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any

    const userRoleRepository = {
      save: jest.fn(),
    } as any

    storageService = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        { provide: getRepositoryToken(Profile), useValue: profileRepository },
        { provide: getRepositoryToken(UserRole), useValue: userRoleRepository },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('findAll', () => {
    it('returns all users with relations', async () => {
      userRepository.find.mockResolvedValue([mockUser])
      const result = await service.findAll()
      expect(result).toHaveLength(1)
      expect(userRepository.find).toHaveBeenCalledWith({ relations: ['profile', 'roles', 'roles.role'] })
    })
  })

  describe('findByEmail', () => {
    it('finds user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser)
      const result = await service.findByEmail('test@example.com')
      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['profile', 'roles', 'roles.role'],
      })
    })

    it('returns null if not found', async () => {
      userRepository.findOne.mockResolvedValue(null)
      const result = await service.findByEmail('notfound@email.com')
      expect(result).toBeNull()
    })
  })

  describe('findOne', () => {
    it('finds user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser)
      const result = await service.findOne('user-1')
      expect(result).toEqual(mockUser)
    })
  })

  describe('update', () => {
    it('updates user fields', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 } as any)
      userRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.update('user-1', { isEmailVerified: true })
      expect(result).toEqual(mockUser)
      expect(userRepository.update).toHaveBeenCalledWith('user-1', { isEmailVerified: true })
    })
  })

  describe('updateProfile', () => {
    const profileData = { firstName: 'Updated', lastName: 'Name' }

    it('updates existing profile', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          profile: { ...mockUser.profile, firstName: 'Updated', lastName: 'Name' },
        })
      profileRepository.update.mockResolvedValue({ affected: 1 } as any)

      const result = await service.updateProfile('user-1', profileData)
      expect(profileRepository.update).toHaveBeenCalledWith('profile-1', profileData)
      expect(result).toBeDefined()
    })

    it('creates profile if none exists', async () => {
      const userWithoutProfile = { ...mockUser, profile: null }
      userRepository.findOne
        .mockResolvedValueOnce(userWithoutProfile)
        .mockResolvedValueOnce({
          ...userWithoutProfile,
          profile: { id: 'new-profile', ...profileData },
        })
      profileRepository.create.mockReturnValue({ id: 'new-profile', ...profileData } as any)
      profileRepository.save.mockResolvedValue({ id: 'new-profile' } as any)

      const result = await service.updateProfile('user-1', profileData)
      expect(profileRepository.create).toHaveBeenCalled()
      expect(profileRepository.save).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('deletes old avatar when new one is provided', async () => {
      const userWithAvatar = {
        ...mockUser,
        profile: { ...mockUser.profile, avatar: 'https://storage.googleapis.com/bucket/old-avatar.webp' },
      }
      userRepository.findOne
        .mockResolvedValueOnce(userWithAvatar)
        .mockResolvedValueOnce({
          ...userWithAvatar,
          profile: { ...userWithAvatar.profile, avatar: 'https://storage.googleapis.com/bucket/new-avatar.webp' },
        })
      profileRepository.update.mockResolvedValue({ affected: 1 } as any)

      await service.updateProfile('user-1', { avatar: 'https://storage.googleapis.com/bucket/new-avatar.webp' })
      expect(storageService.deleteFile).toHaveBeenCalledWith('https://storage.googleapis.com/bucket/old-avatar.webp')
    })

    it('throws NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null)
      await expect(service.updateProfile('nonexistent', profileData)).rejects.toThrow(NotFoundException)
    })
  })
})
