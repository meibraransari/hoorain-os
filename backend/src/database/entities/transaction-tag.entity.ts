import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Tag } from './tag.entity';

@Entity('transaction_tags')
export class TransactionTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, (t) => t.transactionTags)
  transaction: Transaction;

  @Column()
  transactionId: string;

  @ManyToOne(() => Tag)
  tag: Tag;

  @Column()
  tagId: string;
}
