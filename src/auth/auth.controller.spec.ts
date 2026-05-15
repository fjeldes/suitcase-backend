import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-1', email: 'test@example.com', name: 'Test', roles: ['client'], mustChangePassword: false },
  }

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      signUp: jest.fn(),
      loginWithGoogle: jest.fn(),
      refreshTokens: jest.fn(),
      becomeOwner: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationCode: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      authService.login.mockResolvedValue(mockTokens)
      const result = await controller.login({ email: 'test@example.com', password: 'pass123' })
      expect(result).toEqual(mockTokens)
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'pass123')
    })
  })

  describe('signup', () => {
    it('calls authService.signUp and returns tokens', async () => {
      const dto = { email: 'new@example.com', password: 'pass123', firstName: 'Test', lastName: 'User' }
      authService.signUp.mockResolvedValue(mockTokens)
      const result = await controller.signup(dto)
      expect(result).toEqual(mockTokens)
      expect(authService.signUp).toHaveBeenCalledWith(dto)
    })
  })

  describe('googleLogin', () => {
    it('calls loginWithGoogle with token', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockTokens)
      const result = await controller.googleLogin({ token: 'google-token' })
      expect(result).toEqual(mockTokens)
      expect(authService.loginWithGoogle).toHaveBeenCalledWith('google-token')
    })
  })

  describe('refresh', () => {
    it('calls refreshTokens with refresh token', async () => {
      authService.refreshTokens.mockResolvedValue(mockTokens)
      const result = await controller.refresh({ refresh_token: 'refresh-token' })
      expect(result).toEqual(mockTokens)
      expect(authService.refreshTokens).toHaveBeenCalledWith('refresh-token')
    })

    it('throws if refresh_token is missing', async () => {
      await expect(controller.refresh({ refresh_token: '' })).rejects.toThrow()
    })
  })

  describe('becomeOwner', () => {
    it('calls becomeOwner with userId from token', async () => {
      authService.becomeOwner.mockResolvedValue(mockTokens)
      const req = { user: { userId: 'user-1' } }
      const result = await controller.becomeOwner(req)
      expect(result).toEqual(mockTokens)
      expect(authService.becomeOwner).toHaveBeenCalledWith('user-1')
    })
  })

  describe('verifyEmail', () => {
    it('calls verifyEmail with email and code', async () => {
      authService.verifyEmail.mockResolvedValue(mockTokens)
      const result = await controller.verifyEmail({ email: 'test@example.com', code: '123456' })
      expect(result).toEqual(mockTokens)
      expect(authService.verifyEmail).toHaveBeenCalledWith('test@example.com', '123456')
    })
  })

  describe('resendCode', () => {
    it('calls resendVerificationCode', async () => {
      authService.resendVerificationCode.mockResolvedValue({ message: 'Code sent' })
      const result = await controller.resendCode({ email: 'test@example.com' })
      expect(result).toEqual({ message: 'Code sent' })
    })
  })

  describe('forgotPassword', () => {
    it('calls forgotPassword', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'If the email exists, a code was sent' })
      const result = await controller.forgotPassword({ email: 'test@example.com' })
      expect(result).toEqual({ message: 'If the email exists, a code was sent' })
    })
  })

  describe('resetPassword', () => {
    it('calls resetPassword', async () => {
      authService.resetPassword.mockResolvedValue({ message: 'Password updated successfully' })
      const result = await controller.resetPassword({ email: 'test@example.com', code: '123456', newPassword: 'newpass' })
      expect(result).toEqual({ message: 'Password updated successfully' })
      expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com', '123456', 'newpass')
    })
  })

  describe('changePassword', () => {
    it('calls changePassword with userId and passwords', async () => {
      authService.changePassword.mockResolvedValue({ message: 'Password updated' })
      const req = { user: { userId: 'user-1' } }
      const result = await controller.changePassword(req, { currentPassword: 'old', newPassword: 'new' })
      expect(result).toEqual({ message: 'Password updated' })
      expect(authService.changePassword).toHaveBeenCalledWith('user-1', 'old', 'new')
    })
  })
})
