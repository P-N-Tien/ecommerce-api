import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './service/password.service';
import { UsersService } from '../users/user.service';
import { UsersModule } from '../users/user.module';
import { TokenService } from './service/token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, UsersService, TokenService],
})
export class AuthModule {}
