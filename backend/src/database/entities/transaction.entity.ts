import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Account } from './account.entity';
import { Category } from './category.entity';
import { User } from './user.entity';
import { TransactionTag } from './transaction-tag.entity';
import { TransactionSplit } from './transaction-split.entity';
import { Attachment } from './attachment.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'goal_id', nullable: true })
  goalId: string;

  @Column({ name: 'budget_id', nullable: true })
  budgetId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  merchant: string;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurring_id', nullable: true })
  recurringId: string;

  @Column({ name: 'is_pending', default: false })
  isPending: boolean;

  @Column({ name: 'is_transfer', default: false })
  isTransfer: boolean;

  @Column({ name: 'exclude_from_balance', default: false, nullable: true })
  excludeFromBalance: boolean;

  @Column({ name: 'transfer_pair_id', nullable: true })
  transferPairId: string;

  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => TransactionTag, (tt) => tt.transaction)
  transactionTags: TransactionTag[];

  @OneToMany(() => TransactionSplit, (ts) => ts.transaction)
  splits: TransactionSplit[];

  @OneToMany(() => Attachment, (a) => a.transaction)
  attachments: Attachment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
