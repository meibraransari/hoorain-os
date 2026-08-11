import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  LOAN = 'loan',
  CRYPTO = 'crypto',
  DIGITAL_WALLET = 'digital_wallet',
  CUSTOM = 'custom',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.BANK })
  type: AccountType;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ name: 'initial_balance', type: 'decimal', precision: 20, scale: 4, default: 0 })
  initialBalance: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 20, scale: 4, default: 0 })
  currentBalance: number;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 20, scale: 4, default: 0, nullable: true })
  creditLimit: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'include_in_net_worth', default: true })
  includeInNetWorth: boolean;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'account_number', nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
