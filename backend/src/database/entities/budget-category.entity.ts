import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Budget } from './budget.entity';
import { Category } from './category.entity';

@Entity('budget_categories')
export class BudgetCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Budget)
  budget: Budget;

  @Column()
  budgetId: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column()
  categoryId: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  limitAmount: number;
}
