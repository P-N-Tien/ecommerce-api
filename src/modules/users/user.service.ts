import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/auth.dto';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { EmailAlreadyExistsException } from '../auth/exception/email-already-exists.exception';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    try {
      const newUser = this.userRepository.create({ email: dto.email, password: dto.password });
      await this.userRepository.save(newUser);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new EmailAlreadyExistsException('Email already exists');
      }
      this.logger.error('Failed to register user', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
