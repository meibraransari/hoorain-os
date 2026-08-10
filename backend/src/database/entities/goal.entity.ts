import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'target_amount', type: 'decimal', precision: 20, scale: 4 })
  targetAmount: number;

  @Column({ name: 'current_amount', type: 'decimal', precision: 20, scale: 4, default: 0 })
  currentAmount: number;

  @Column({ default: 'income', nullable: true })
  type: string; // 'income' (savings goal) or 'expense' (spending target goal)

  @Column({ name: 'account_id', nullable: true })
  accountId: string; // Linked account ID

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
