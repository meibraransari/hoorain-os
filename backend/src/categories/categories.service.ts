import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /**
   * Categories with userId === null are global defaults shared by every
   * user, so they are always included alongside the user's own categories.
   */
  async findAll(userId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: [{ userId }, { userId: IsNull() }],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: [
        { id, userId },
        { id, userId: IsNull() },
      ],
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepo.create({ ...dto, userId, isDefault: false });
    return this.categoryRepo.save(category);
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id, userId);
    if (category.userId === null) {
      throw new ForbiddenException('Cannot modify a global default category');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const category = await this.findOne(id, userId);
    if (category.userId === null) {
      throw new ForbiddenException('Cannot delete a global default category');
    }
    await this.categoryRepo.remove(category);
    return { id, deleted: true };
  }
}
