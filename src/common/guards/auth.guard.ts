import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { COOKIE_DEFAULTS, ENV_KEYS } from '../utils/constants';
import { TokenService } from '@/modules/auth/service/token.service';

interface IUserPayload {
  sub: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  cookies: Record<string, string | undefined>;
  user?: IUserPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const accessCookieName =
      this.configService.get<string>(ENV_KEYS.JWT_ACCESS_COOKIE_NAME) ?? COOKIE_DEFAULTS.ACCESS_NAME;

    const token = request.cookies[accessCookieName];

    if (!token) {
      throw new UnauthorizedException('Access token missing from cookies');
    }

    try {
      const payload = (await this.tokenService.verifyToken(token)) as IUserPayload;
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }
}
