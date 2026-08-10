import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Category } from './category.entity';

@Entity('transaction_splits')
export class TransactionSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, (t) => t.splits)
  transaction: Transaction;

  @Column()
  transactionId: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column()
  categoryId: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;
}
