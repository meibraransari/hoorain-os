import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { Account } from '../database/entities/account.entity';
import { Category } from '../database/entities/category.entity';
import { Budget } from '../database/entities/budget.entity';
import { Goal } from '../database/entities/goal.entity';

const CSV_COLUMNS = [
  'id',
  'title',
  'amount',
  'type',
  'date',
  'accountName',
  'categoryName',
  'notes',
  'merchant',
  'paymentMethod',
  'isTransfer',
] as const;

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
  ) {}

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { userId },
      relations: ['account', 'category'],
      order: { date: 'DESC' },
    });
  }

  async getFullBackup(userId: string) {
    const [accounts, categories, transactions, budgets, goals] = await Promise.all([
      this.accountRepo.find({ where: { userId } }),
      this.categoryRepo.find({ where: { userId } }),
      this.transactionRepo.find({ where: { userId }, relations: ['account', 'category'], order: { date: 'DESC' } }),
      this.budgetRepo.find({ where: { userId } }),
      this.goalRepo.find({ where: { userId } }),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totals: {
        accounts: accounts.length,
        categories: categories.length,
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
      },
      accounts,
      categories,
      transactions,
      budgets,
      goals,
    };
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  toCsv(transactions: Transaction[]): string {
    const header = ['ID', 'Title', 'Amount', 'Type', 'Date', 'Account', 'Category', 'Notes', 'Merchant', 'Payment Method', 'Is Transfer'].join(',');
    const rows = transactions.map((tx) => {
      const rowData = {
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        accountName: tx.account?.name || tx.accountId || '',
        categoryName: tx.category?.name || tx.categoryId || '',
        notes: tx.notes || '',
        merchant: tx.merchant || '',
        paymentMethod: tx.paymentMethod || '',
        isTransfer: tx.isTransfer ? 'Yes' : 'No',
      };
      return CSV_COLUMNS.map((column) => this.escapeCsvValue(rowData[column])).join(',');
    });

    return [header, ...rows].join('\n');
  }
}
