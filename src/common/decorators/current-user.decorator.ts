import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
interface RequestWithUser extends Request {
  user?: Record<string, unknown>;
}

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext): unknown => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  const user = request.user;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
});
