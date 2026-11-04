import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, LoginResponseDto, RegisterDto } from './dto/auth.dto';
import { PasswordService } from './service/password.service';
import { UsersService } from '../users/user.service';
import { sanitizeEmail } from 'src/common/utils/email.util';
import { TokenService } from './service/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    const hashedPassword = await this.passwordService.hashPassword(dto.password);
    const sanitizedEmail = sanitizeEmail(dto.email);
    await this.userService.register({ email: sanitizedEmail, password: hashedPassword });
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const sanitizedEmail = sanitizeEmail(dto.email);

    const user = await this.userService.findByEmail(sanitizedEmail);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('User account is inactive');

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const { accessToken, refreshToken } = await this.tokenService.generateAuthTokens(payload);

    return { accessToken, refreshToken };
  }
}
