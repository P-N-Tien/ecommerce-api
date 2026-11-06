import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class CategoryModule {}
