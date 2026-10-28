import { Module } from '@nestjs/common';
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [],
  controllers: [],
})
export class UsersModule {}
