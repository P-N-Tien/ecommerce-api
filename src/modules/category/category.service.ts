import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Category } from './entity/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesQueryDto } from './dto/get-categories-query.dto';
import { API_ERROR_CODES, createApiErrorPayload, createFieldError } from '@/common/errors/api-error';

interface CategoryListResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(query: GetCategoriesQueryDto): Promise<CategoryListResponse> {
    const { page, limit, search, status, parentId, sortBy, sortOrder } = query;
    const searchFilters = search ? [{ name: ILike(`%${search}%`) }, { slug: ILike(`%${search}%`) }] : [{}];
    const where = searchFilters.map((filter) => ({
      ...filter,
      ...(status ? { status } : {}),
      ...(parentId ? { parentId } : {}),
    }));
    const orderBy = sortBy;
    const [items, total] = await this.categoryRepository.findAndCount({
      where,
      order: { [orderBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) {
      await this.ensureParentExists(dto.parentId);
    }
    const category = this.categoryRepository.create(dto);
    return this.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('A category cannot be its own parent');
      }
      await this.ensureParentExists(dto.parentId);
    }

    Object.assign(category, dto);
    return this.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  private async ensureParentExists(parentId: string): Promise<void> {
    const parentExists = await this.categoryRepository.exists({ where: { id: parentId } });
    if (!parentExists) {
      throw new NotFoundException('Parent category not found');
    }
  }

  private async save(category: Category): Promise<Category> {
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        throw new ConflictException(
          createApiErrorPayload(API_ERROR_CODES.DUPLICATE_SLUG, 'Category slug already exists', [
            createFieldError('slug', 'SLUG_ALREADY_EXISTS', 'Category slug already exists'),
          ]),
        );
      }
      throw error;
    }
  }
}
