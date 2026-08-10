import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('category_rules')
export class CategoryRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column()
  categoryId: string;

  @Column()
  title: string;

  @Column({ default: false })
  isExactMatch: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ nullable: true })
  externalId: string;

  @CreateDateColumn()
  createdAt: Date;
}
