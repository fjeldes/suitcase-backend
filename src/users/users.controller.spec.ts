import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: jest.Mocked<UsersService>

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      updateProfile: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  describe('findAll', () => {
    it('returns all users', async () => {
      const mockUsers = [{ id: 'user-1', email: 'test@example.com' }]
      usersService.findAll.mockResolvedValue(mockUsers as any)

      const result = await controller.findAll()
      expect(result).toEqual(mockUsers)
      expect(usersService.findAll).toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    it('updates profile for authenticated user', async () => {
      const profileData = { firstName: 'Updated' }
      const req = { user: { id: 'user-1' } }
      const expectedResult = { id: 'user-1', email: 'test@example.com', profile: { firstName: 'Updated' } }
      usersService.updateProfile.mockResolvedValue(expectedResult as any)

      const result = await controller.updateProfile(req, profileData)
      expect(result).toEqual(expectedResult)
      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', profileData)
    })
  })
})
