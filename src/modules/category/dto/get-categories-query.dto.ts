import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { CategoryStatus } from '../category-status.enum';
import { Category } from '@/modules/category/entity/category.entity';

function normalizeSortOrder(value: unknown): unknown {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

export class GetCategoriesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Search category name or slug' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category status', enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiPropertyOptional({ description: 'Filter by parent category UUID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ enum: ['name', 'createdAt'], default: 'name' })
  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sortBy: 'name' | 'createdAt' = 'name';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @Transform(({ value }) => normalizeSortOrder(value))
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'ASC';
}

export interface CategoryListResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
