import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { TokenService } from '@/modules/auth/service/token.service';

interface IUserPayload {
  sub: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user?: IUserPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
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

    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ', 2) ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Access token missing from Authorization header');
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
