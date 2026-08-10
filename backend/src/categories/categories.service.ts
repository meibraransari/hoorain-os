import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, DataSource } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
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
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const category = await this.findOne(id, userId);

    await this.dataSource.transaction(async (manager) => {
      // 1. Unlink child subcategories
      await manager.query(`UPDATE categories SET parent_id = NULL WHERE parent_id = $1`, [id]);
      // 2. Unlink transactions referencing this category
      await manager.query(`UPDATE transactions SET category_id = NULL WHERE category_id = $1`, [id]);
      // 3. Delete budget category limits
      await manager.query(`DELETE FROM budget_categories WHERE category_id = $1`, [id]);
      // 4. Delete category rules
      await manager.query(`DELETE FROM category_rules WHERE category_id = $1`, [id]);
      // 5. Delete category record
      await manager.query(`DELETE FROM categories WHERE id = $1`, [id]);
    });

    return { id, deleted: true };
  }
}
