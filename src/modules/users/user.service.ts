import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/auth.dto';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { EmailAlreadyExistsException } from '../auth/exception/email-already-exists.exception';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    try {
      const newUser = this.userRepository.create({ email: dto.email, password: dto.password });
      await this.userRepository.save(newUser);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new EmailAlreadyExistsException('Email already exists');
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
