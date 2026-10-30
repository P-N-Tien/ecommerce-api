import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { RegisterDto } from './dto/auth.dto';
import { EmailAlreadyExistsException } from './exception/email-already-exists.exception';
import { PasswordService } from './service/password.service';

describe('AuthService', () => {
  let authService: AuthService;

  let userService: {
    register: ReturnType<typeof vi.fn>;
  };

  let passwordService: {
    hashPassword: ReturnType<typeof vi.fn>;
  };

  const mockRegisterDto: RegisterDto = {
    email: '  TEST@GMAIL.COM  ',
    password: 'Password123!',
  };

  const hashedPassword = 'hashed_password';

  beforeEach(async () => {
    userService = {
      register: vi.fn(),
    };

    passwordService = {
      hashPassword: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockResolvedValue(undefined);

      await expect(authService.register(mockRegisterDto)).resolves.toBeUndefined();

      expect(passwordService.hashPassword).toHaveBeenCalledOnce();
      expect(passwordService.hashPassword).toHaveBeenCalledWith(mockRegisterDto.password);

      expect(userService.register).toHaveBeenCalledOnce();
      expect(userService.register).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        password: hashedPassword,
      });
    });

    it('should throw error when password hashing fails', async () => {
      const error = new Error('Password hashing failed');

      passwordService.hashPassword.mockRejectedValue(error);

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(error);

      expect(userService.register).not.toHaveBeenCalled();
    });

    it('should sanitize email before registering user', async () => {
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockResolvedValue(undefined);

      await authService.register(mockRegisterDto);

      expect(userService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
        }),
      );
    });

    it('should hash password before registering user', async () => {
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockResolvedValue(undefined);

      await authService.register(mockRegisterDto);

      expect(userService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        }),
      );
    });

    it('should propagate EmailAlreadyExistsException', async () => {
      const error = new EmailAlreadyExistsException('Email already exists');

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockRejectedValue(error);

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(EmailAlreadyExistsException);
    });

    it('should propagate error when user registration fails', async () => {
      const error = new Error('Database connection failed');

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockRejectedValue(error);

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(error);
    });

    it('should handle concurrent registration with the same email', async () => {
      const duplicateEmailError = new EmailAlreadyExistsException('Email already exists');

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userService.register.mockResolvedValueOnce(undefined);
      userService.register.mockRejectedValueOnce(duplicateEmailError);

      const results = await Promise.allSettled([
        authService.register(mockRegisterDto),
        authService.register(mockRegisterDto),
      ]);

      expect(results).toHaveLength(2);

      expect(results[0].status).toBe('fulfilled');

      expect(results[1].status).toBe('rejected');

      if (results[1].status === 'rejected') {
        expect(results[1].reason).toBeInstanceOf(EmailAlreadyExistsException);
      }

      expect(passwordService.hashPassword).toHaveBeenCalledTimes(2);
      expect(userService.register).toHaveBeenCalledTimes(2);
    });
  });
});
