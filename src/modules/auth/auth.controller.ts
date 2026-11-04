import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
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
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { clearCookieOptions, getCookieOptions } from 'src/common/utils/cookie';
import { COOKIE_DEFAULTS, ENV_KEYS } from 'src/common/utils/constants';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
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
  @ApiOperation({ summary: 'User login authentication' })
  @ApiOkResponse({ description: 'Successfully authenticated and logged in.' })
  @ApiBadRequestResponse({ description: 'Invalid login payload format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials provided.' })
  @ApiForbiddenResponse({ description: 'User account is inactive.' })
  @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    const baseCookieOptions = getCookieOptions(this.configService);

    const accessCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_ACCESS_COOKIE_NAME) || COOKIE_DEFAULTS.ACCESS_NAME;
    const accessMaxAge =
      Number(this.configService.get<number>(ENV_KEYS.JWT_ACCESS_MAX_AGE_MS)) || COOKIE_DEFAULTS.ACCESS_MAX_AGE;

    response.cookie(accessCookieName, accessToken, {
      ...baseCookieOptions,
      maxAge: accessMaxAge,
    });

    const refreshCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_REFRESH_COOKIE_NAME) || COOKIE_DEFAULTS.REFRESH_NAME;
    const refreshMaxAge =
      Number(this.configService.get<number>(ENV_KEYS.JWT_REFRESH_MAX_AGE_MS)) || COOKIE_DEFAULTS.REFRESH_MAX_AGE;

    response.cookie(refreshCookieName, refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshMaxAge,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token in cookie' })
  @ApiOkResponse({ description: 'Successfully refreshed tokens.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const refreshCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_REFRESH_COOKIE_NAME) || COOKIE_DEFAULTS.REFRESH_NAME;
    const accessCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_ACCESS_COOKIE_NAME) || COOKIE_DEFAULTS.ACCESS_NAME;

    const cookies = (request.cookies ?? {}) as Record<string, string | undefined>;
    const oldRefreshToken = cookies[refreshCookieName];

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshTokens(oldRefreshToken);

      const baseCookieOptions = getCookieOptions(this.configService);

      const accessMaxAge =
        Number(this.configService.get<number>(ENV_KEYS.JWT_ACCESS_MAX_AGE_MS)) || COOKIE_DEFAULTS.ACCESS_MAX_AGE;
      response.cookie(accessCookieName, accessToken, {
        ...baseCookieOptions,
        maxAge: accessMaxAge,
      });

      const refreshMaxAge =
        Number(this.configService.get<number>(ENV_KEYS.JWT_REFRESH_MAX_AGE_MS)) || COOKIE_DEFAULTS.REFRESH_MAX_AGE;
      response.cookie(refreshCookieName, newRefreshToken, {
        ...baseCookieOptions,
        maxAge: refreshMaxAge,
      });
    } catch {
      const clearOptions = clearCookieOptions(this.configService);
      response.clearCookie(accessCookieName, clearOptions);
      response.clearCookie(refreshCookieName, clearOptions);

      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
