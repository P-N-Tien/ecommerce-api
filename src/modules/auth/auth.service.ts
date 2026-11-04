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
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const { accessToken, refreshToken } = await this.tokenService.generateAuthTokens(payload);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const isRefreshToken = true;
      const payload = await this.tokenService.verifyToken(refreshToken, isRefreshToken);

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid refresh token structure');
      }

      const user = await this.userService.findOneById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (!user.isActive) {
        throw new ForbiddenException('User account is inactive');
      }

      const tokenPayload = { sub: user.id, email: user.email };
      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(tokenPayload),
        this.tokenService.generateRefreshToken(tokenPayload),
      ]);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
