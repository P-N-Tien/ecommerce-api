import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { clearCookieOptions, getCookieOptions } from '@/common/utils/cookie';
import { COOKIE_DEFAULTS, ENV_KEYS } from '@/common/utils/constants';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'User registered successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid input data provided.' })
  @ApiConflictResponse({ description: 'Email address already exists.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error occurred.' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    await this.authService.register(dto);
    return { message: 'User registered successfully.' };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login authentication' })
  @ApiOkResponse({ description: 'Successfully authenticated and logged in.' })
  @ApiBadRequestResponse({ description: 'Invalid login payload format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials provided.' })
  @ApiForbiddenResponse({ description: 'User account is inactive.' })
  @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; permissions: string[] }> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    const baseCookieOptions = getCookieOptions(this.configService);
    const refreshCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_REFRESH_COOKIE_NAME) || COOKIE_DEFAULTS.REFRESH_NAME;
    const refreshMaxAge =
      Number(this.configService.get<number>(ENV_KEYS.JWT_REFRESH_MAX_AGE_MS)) || COOKIE_DEFAULTS.REFRESH_MAX_AGE;

    response.cookie(refreshCookieName, refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshMaxAge,
    });

    return {
      accessToken,
      permissions: [
        'view_all_orders',
        'manage_orders',
        'view_all_products',
        'manage_products',
        'view_all_inventory',
        'manage_inventory',
        'view_all_users',
        'manage_users',
        'manage_roles',
        'access_admin',
      ],
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token in cookie' })
  @ApiOkResponse({ description: 'Successfully refreshed tokens.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; permissions: string[] }> {
    const refreshCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_REFRESH_COOKIE_NAME) || COOKIE_DEFAULTS.REFRESH_NAME;
    const cookies = (request.cookies ?? {}) as Record<string, string | undefined>;
    const oldRefreshToken = cookies[refreshCookieName];

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshTokens(oldRefreshToken);
      const baseCookieOptions = getCookieOptions(this.configService);

      const refreshMaxAge =
        Number(this.configService.get<number>(ENV_KEYS.JWT_REFRESH_MAX_AGE_MS)) || COOKIE_DEFAULTS.REFRESH_MAX_AGE;
      response.cookie(refreshCookieName, newRefreshToken, {
        ...baseCookieOptions,
        maxAge: refreshMaxAge,
      });

      return {
        accessToken,
        permissions: [
          'view_all_orders',
          'manage_orders',
          'view_all_products',
          'manage_products',
          'view_all_inventory',
          'manage_inventory',
          'view_all_users',
          'manage_users',
          'manage_roles',
          'access_admin',
        ],
      };
    } catch {
      const clearOptions = clearCookieOptions(this.configService);
      response.clearCookie(refreshCookieName, clearOptions);

      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the current user password' })
  @ApiOkResponse({ description: 'Password changed successfully.' })
  @ApiBadRequestResponse({ description: 'Current password is incorrect or password confirmation does not match.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(userId, dto);
    return { message: 'Password changed successfully.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout and clear session cookies' })
  @ApiOkResponse({ description: 'Successfully logged out and cookies cleared.' })
  logout(@Res({ passthrough: true }) response: Response): void {
    const refreshCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_REFRESH_COOKIE_NAME) || COOKIE_DEFAULTS.REFRESH_NAME;
    const clearOptions = clearCookieOptions(this.configService);

    response.clearCookie(refreshCookieName, clearOptions);
  }
}
