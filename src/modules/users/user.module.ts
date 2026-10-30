import { Module } from '@nestjs/common';
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
