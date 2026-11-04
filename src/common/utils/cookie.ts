import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import { ENV_KEYS } from './constants';

export const getCookieOptions = (configService: ConfigService): CookieOptions => {
  const isProduction = configService.get<string>(ENV_KEYS.NODE_ENV) === 'production';
  const secureEnv = configService.get<string>(ENV_KEYS.COOKIE_SECURE);
  const sameSiteConfig = configService.get<string>(ENV_KEYS.COOKIE_SAME_SITE) || 'lax';

  return {
    httpOnly: true,
    secure: secureEnv ? secureEnv === 'true' : isProduction,
    sameSite: sameSiteConfig as 'lax' | 'strict' | 'none',
  };
};

export const clearCookieOptions = (configService: ConfigService): CookieOptions => {
  const isProduction = configService.get<string>(ENV_KEYS.NODE_ENV) === 'production';
  const secureEnv = configService.get<string>(ENV_KEYS.COOKIE_SECURE);
  const sameSiteConfig = configService.get<string>(ENV_KEYS.COOKIE_SAME_SITE) || 'lax';

  return {
    httpOnly: true,
    secure: secureEnv ? secureEnv === 'true' : isProduction,
    sameSite: sameSiteConfig as 'lax' | 'strict' | 'none',
  };
};
