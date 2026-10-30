import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';
import { PasswordService } from './service/password.service';
import { UsersService } from '../users/user.service';
import { sanitizeEmail } from 'src/common/utils/email.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    const hashedPassword = await this.passwordService.hashPassword(dto.password);
    const sanitizedEmail = sanitizeEmail(dto.email);
    await this.userService.register({ email: sanitizedEmail, password: hashedPassword });
  }
}
