import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './service/password.service';
import { UsersService } from '../users/user.service';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, UsersService],
})
export class AuthModule {}
