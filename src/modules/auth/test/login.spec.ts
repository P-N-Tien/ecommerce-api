import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { UsersService } from '../../users/user.service';
import { PasswordService } from '../service/password.service';
import { TokenService } from '../service/token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let moduleRef: TestingModule;

  let userService: {
    findByEmail: ReturnType<typeof vi.fn>;
  };

  let passwordService: {
    comparePassword: ReturnType<typeof vi.fn>;
  };

  let tokenService: {
    generateAuthTokens: ReturnType<typeof vi.fn>;
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const loginDto = {
    email: 'test@example.com',
    password: 'PlainPassword123!',
  };

  beforeEach(async () => {
    userService = {
      findByEmail: vi.fn(),
    };

    passwordService = {
      comparePassword: vi.fn(),
    };

    tokenService = {
      generateAuthTokens: vi.fn(),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: userService,
        },
        {
          provide: PasswordService,
          useValue: passwordService,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await moduleRef.close();
  });

  describe('login', () => {
    it('should login successfully and return auth tokens', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);
      tokenService.generateAuthTokens.mockResolvedValue(mockTokens);

      const result = await authService.login(loginDto);

      expect(result).toEqual(mockTokens);

      expect(userService.findByEmail).toHaveBeenCalledOnce();
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);

      expect(passwordService.comparePassword).toHaveBeenCalledOnce();
      expect(passwordService.comparePassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);

      expect(tokenService.generateAuthTokens).toHaveBeenCalledOnce();
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(passwordService.comparePassword).not.toHaveBeenCalled();
      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user account is inactive', async () => {
      userService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(loginDto)).rejects.toThrow(ForbiddenException);

      expect(passwordService.comparePassword).not.toHaveBeenCalled();
      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should not generate tokens if password comparison fails unexpectedly', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockRejectedValue(new Error('Password comparison failed'));

      await expect(authService.login(loginDto)).rejects.toThrow('Password comparison failed');

      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should propagate error if user lookup fails', async () => {
      userService.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.login(loginDto)).rejects.toThrow('Database connection failed');

      expect(passwordService.comparePassword).not.toHaveBeenCalled();
      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should propagate error if token generation fails', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);
      tokenService.generateAuthTokens.mockRejectedValue(new Error('Token generation failed'));

      await expect(authService.login(loginDto)).rejects.toThrow('Token generation failed');
    });
  });
});
