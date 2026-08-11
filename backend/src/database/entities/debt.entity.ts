import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  interestRate: number; // Annual Percentage Rate (APR %)

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  minimumPayment: number;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0 })
  extraPayment: number;

  @Column({ nullable: true })
  category: string; // e.g. Credit Card, Home Loan, Car Loan, Personal Loan

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
