import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryListResponse, GetCategoriesQueryDto } from './dto/get-categories-query.dto';
import { Category } from './entity/category.entity';

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({ description: 'Categories returned successfully.', type: [Category] })
  findAll(@Query() query: GetCategoriesQueryDto): Promise<CategoryListResponse> {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({ description: 'Category returned successfully.', type: Category })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ description: 'Category created successfully.', type: Category })
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ description: 'Category updated successfully.', type: Category })
  @ApiNotFoundResponse({ description: 'Category or parent category not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiNoContentResponse({ description: 'Category deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
}
