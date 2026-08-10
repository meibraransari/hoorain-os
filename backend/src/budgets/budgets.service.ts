import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../database/entities/budget.entity';
import { BudgetCategory } from '../database/entities/budget-category.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService implements OnModuleInit {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepo: Repository<BudgetCategory>,
  ) {}

  async onModuleInit() {
    try {
      await this.budgetRepo.query(`
        ALTER TABLE budgets ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(20,4) DEFAULT 0;
      `);
    } catch (err) {
      console.error('BudgetsService init error:', err);
    }
  }

  private async attachCategories(budget: Budget) {
    const categories = await this.budgetCategoryRepo.find({ where: { budgetId: budget.id } });
    return { ...budget, categories };
  }

  async findAll(userId: string) {
    const budgets = await this.budgetRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(budgets.map((budget) => this.attachCategories(budget)));
  }

  async findOne(id: string, userId: string) {
    const budget = await this.budgetRepo.findOne({ where: { id, userId } });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return this.attachCategories(budget);
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const { categories, ...budgetData } = dto;
    const budget = this.budgetRepo.create({ ...budgetData, userId });
    await this.budgetRepo.save(budget);

    if (categories?.length) {
      const allocations = categories.map((allocation) =>
        this.budgetCategoryRepo.create({ ...allocation, budgetId: budget.id }),
      );
      await this.budgetCategoryRepo.save(allocations);
    }

    return this.findOne(budget.id, userId);
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    const budget = await this.budgetRepo.findOne({ where: { id, userId } });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    const { categories, ...budgetData } = dto;
    Object.assign(budget, budgetData);
    await this.budgetRepo.save(budget);

    if (categories) {
      await this.budgetCategoryRepo.delete({ budgetId: id });
      if (categories.length) {
        const allocations = categories.map((allocation) =>
          this.budgetCategoryRepo.create({ ...allocation, budgetId: id }),
        );
        await this.budgetCategoryRepo.save(allocations);
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const budget = await this.budgetRepo.findOne({ where: { id, userId } });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    await this.budgetCategoryRepo.delete({ budgetId: id });
    await this.budgetRepo.remove(budget);
    return { id, deleted: true };
  }
}
