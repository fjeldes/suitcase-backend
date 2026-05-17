import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'

import { AuthService } from './auth.service'
import { UsersService } from 'src/users/users.service'
import { MailService } from 'src/mail/mail.service'
import { TermsService } from 'src/terms/terms.service'
import { User } from 'src/users/entities/user.entity'
import { Role } from 'src/users/entities/role.entity'

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$10$hashedPassword'),
}))

import * as bcrypt from 'bcrypt'

describe('AuthService', () => {
  let service: AuthService
  let usersService: jest.Mocked<UsersService>
  let jwtService: jest.Mocked<JwtService>
  let dataSource: jest.Mocked<DataSource>
  let mailService: jest.Mocked<MailService>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    isEmailVerified: true,
    isActive: true,
    mustChangePassword: false,
    otpCode: null,
    otpExpiresAt: null,
    stripeCustomerId: null,
    profile: { firstName: 'Test', lastName: 'User' },
    roles: [{ role: { name: 'client' } }],
  } as any

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-1', email: 'test@example.com', name: 'Test', roles: ['client'], mustChangePassword: false },
  }

  let mockQueryRunner: any

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({ id: 'new-id' }),
        findOne: jest.fn(),
      },
    }

    ;(bcrypt.compare as jest.Mock).mockReset()

    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as any

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    } as any

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'google.clientId') return 'google-client-id'
        if (key === 'jwt.secret') return 'jwt-secret'
        return null
      }),
    } as any

    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    } as any

    const termsService = {
      autoAcceptLatest: jest.fn().mockResolvedValue(undefined),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: DataSource, useValue: dataSource },
        { provide: ConfigService, useValue: configService },
        { provide: MailService, useValue: mailService },
        { provide: TermsService, useValue: termsService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('validateUser', () => {
    it('returns user on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.validateUser('test@example.com', 'password123')
      expect(result).toEqual(mockUser)
    })

    it('throws on wrong email', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      await expect(service.validateUser('wrong@email.com', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('throws on wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      await expect(service.validateUser('test@example.com', 'wrongpass')).rejects.toThrow(UnauthorizedException)
    })

    it('throws if user signed up with Google (no password)', async () => {
      const googleUser = { ...mockUser, password: null }
      usersService.findByEmail.mockResolvedValue(googleUser)
      await expect(service.validateUser('test@example.com', 'any')).rejects.toThrow('Please log in with Google')
    })

    it('throws if email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false }
      usersService.findByEmail.mockResolvedValue(unverifiedUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      await expect(service.validateUser('test@example.com', 'pass')).rejects.toThrow('Please verify your email')
    })
  })

  describe('login', () => {
    it('returns tokens on success', async () => {
      jest.spyOn(service as any, 'validateUser').mockResolvedValue(mockUser)
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.login('test@example.com', 'password123')
      expect(result).toEqual(mockTokens)
    })
  })

  describe('refreshTokens', () => {
    it('returns new tokens on valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', roles: ['client'] })
      usersService.findOne.mockResolvedValue(mockUser)
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.refreshTokens('valid-refresh-token')
      expect(result).toEqual(mockTokens)
    })

    it('throws on invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('expired'))
      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws if user no longer exists', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'deleted-user' })
      usersService.findOne.mockResolvedValue(null)
      await expect(service.refreshTokens('token')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('signUp', () => {
    const dto = { email: 'new@example.com', password: 'password123', firstName: 'New', lastName: 'User' }

    beforeEach(() => {
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner)
    })

    it('creates user and returns tokens', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'role-id', name: 'client' })
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'new-user-id', email: dto.email })
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.signUp(dto)
      expect(result).toEqual(mockTokens)
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled()
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(dto.email, expect.any(String))
    })

    it('throws on duplicate email', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 'existing', email: dto.email })
      await expect(service.signUp(dto)).rejects.toThrow(ConflictException)
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled()
    })

    it('rolls back on error', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'role-id', name: 'client' })
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'))
      await expect(service.signUp(dto)).rejects.toThrow()
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled()
    })
  })

  describe('verifyEmail', () => {
    it('verifies email with correct code', async () => {
      const user = { ...mockUser, isEmailVerified: false, otpCode: '123456', otpExpiresAt: new Date(Date.now() + 60000) }
      usersService.findByEmail.mockResolvedValue(user)
      usersService.update.mockResolvedValue({ ...user, isEmailVerified: true } as any)
      usersService.findOne.mockResolvedValue({ ...user, isEmailVerified: true } as any)
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.verifyEmail('test@example.com', '123456')
      expect(result).toEqual(mockTokens)
      expect(usersService.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ isEmailVerified: true }))
    })

    it('throws on wrong code', async () => {
      const user = { ...mockUser, isEmailVerified: false, otpCode: '123456', otpExpiresAt: new Date(Date.now() + 60000) }
      usersService.findByEmail.mockResolvedValue(user)
      await expect(service.verifyEmail('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('throws on expired code', async () => {
      const user = { ...mockUser, isEmailVerified: false, otpCode: '123456', otpExpiresAt: new Date(Date.now() - 60000) }
      usersService.findByEmail.mockResolvedValue(user)
      await expect(service.verifyEmail('test@example.com', '123456')).rejects.toThrow(UnauthorizedException)
    })

    it('returns message if already verified', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      const result = await service.verifyEmail('test@example.com', '123456')
      expect(result).toEqual({ message: 'Email already verified' })
    })
  })

  describe('resendVerificationCode', () => {
    it('generates new OTP and sends email', async () => {
      const user = { ...mockUser, isEmailVerified: false }
      usersService.findByEmail.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const result = await service.resendVerificationCode('test@example.com')
      expect(result).toEqual({ message: 'Verification code sent' })
      process.env.NODE_ENV = originalNodeEnv
      expect(usersService.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ otpCode: expect.any(String) }))
      expect(mailService.sendVerificationEmail).toHaveBeenCalled()
    })

    it('throws on unknown user', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      await expect(service.resendVerificationCode('unknown@email.com')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('forgotPassword', () => {
    it('generates OTP and sends email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      usersService.update.mockResolvedValue(mockUser)

      const result = await service.forgotPassword('test@example.com')
      expect(result).toEqual({ message: 'If the email exists, a code was sent' })
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled()
    })

    it('returns vague message for unknown email (no enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      const result = await service.forgotPassword('unknown@email.com')
      expect(result).toEqual({ message: 'If the email exists, a code was sent' })
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('resets password with valid code', async () => {
      const user = { ...mockUser, otpCode: '123456', otpExpiresAt: new Date(Date.now() + 60000) }
      usersService.findByEmail.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      const result = await service.resetPassword('test@example.com', '123456', 'newpassword123')
      expect(result).toEqual({ message: 'Password updated successfully' })
      expect(usersService.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ password: expect.any(String), otpCode: null }))
    })

    it('throws on invalid code', async () => {
      const user = { ...mockUser, otpCode: '123456', otpExpiresAt: new Date(Date.now() + 60000) }
      usersService.findByEmail.mockResolvedValue(user)
      await expect(service.resetPassword('test@example.com', 'wrong', 'newpass')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('changePassword', () => {
    it('changes password when current password is correct', async () => {
      usersService.findOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      usersService.update.mockResolvedValue(mockUser)

      const result = await service.changePassword('user-1', 'currentPass', 'newPass123')
      expect(result).toEqual({ message: 'Password updated' })
    })

    it('throws on wrong current password', async () => {
      usersService.findOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      await expect(service.changePassword('user-1', 'wrong', 'newPass')).rejects.toThrow(BadRequestException)
    })

    it('throws for Google-only accounts', async () => {
      const googleUser = { ...mockUser, password: null }
      usersService.findOne.mockResolvedValue(googleUser)
      await expect(service.changePassword('user-1', 'any', 'newPass')).rejects.toThrow(BadRequestException)
    })
  })

  describe('becomeOwner', () => {
    it('adds owner role and returns new tokens', async () => {
      const clientUser = { ...mockUser, roles: [{ role: { name: 'client' } }] }
      usersService.findOne.mockResolvedValue(clientUser)
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner)
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 'owner-role', name: 'owner' })

      const ownerUser = { ...clientUser, roles: [{ role: { name: 'client' } }, { role: { name: 'owner' } }] }
      usersService.findOne.mockResolvedValue(ownerUser)

      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.becomeOwner('user-1')
      expect(result).toEqual(mockTokens)
    })

    it('is idempotent if already owner', async () => {
      const ownerUser = { ...mockUser, roles: [{ role: { name: 'client' } }, { role: { name: 'owner' } }] }
      usersService.findOne.mockResolvedValue(ownerUser)
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens)

      const result = await service.becomeOwner('user-1')
      expect(result).toEqual(mockTokens)
    })
  })
})
