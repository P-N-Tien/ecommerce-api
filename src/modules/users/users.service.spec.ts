import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './user.service';
import { User } from './entity/user.entity';
import { EmailAlreadyExistsException } from '../auth/exception/email-already-exists.exception';

describe('UsersService', () => {
  let usersService: UsersService;

  let userRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    userRepository = {
      create: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should throw EmailAlreadyExistsException when email already exists', async () => {
      const dto = {
        email: 'test@gmail.com',
        password: 'hashed_password',
      };

      userRepository.create.mockReturnValue(dto);

      userRepository.save.mockRejectedValue({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      });

      await expect(usersService.register(dto)).rejects.toThrow(EmailAlreadyExistsException);

      expect(userRepository.create).toHaveBeenCalledOnce();
      expect(userRepository.save).toHaveBeenCalledOnce();
    });
  });
});
