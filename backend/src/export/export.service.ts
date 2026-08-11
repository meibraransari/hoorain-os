import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { Account } from '../database/entities/account.entity';
import { Category } from '../database/entities/category.entity';
import { Budget } from '../database/entities/budget.entity';
import { Goal } from '../database/entities/goal.entity';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

import { ExportQueryDto } from './dto/export-query.dto';

const execAsync = promisify(exec);


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
  private readonly logger = new Logger(ExportService.name);

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
    private readonly dataSource: DataSource,
  ) {}

  async generatePostgresDump() {
    const host = process.env.DATABASE_HOST || 'postgres';
    const port = process.env.DATABASE_PORT || '5432';
    const user = process.env.DATABASE_USER || 'financeos';
    const pass = process.env.DATABASE_PASSWORD || 'financeos_secret_2024';
    const dbName = process.env.DATABASE_NAME || 'financeos';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hoorain_postgres_db_backup_${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const filepath = path.join(backupDir, filename);

    try {
      const cmd = `PGPASSWORD="${pass}" pg_dump -h "${host}" -p "${port}" -U "${user}" -d "${dbName}" --clean --if-exists --inserts`;
      const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });
      fs.writeFileSync(filepath, stdout, 'utf8');
      return { dumpSql: stdout, filename, filepath };
    } catch (err: any) {
      this.logger.warn(`pg_dump command note: ${err.message}. Generating SQL dump via DataSource...`);
      let dumpSql = `-- HOORAIN POSTGRES DATABASE DUMP\n-- Exported At: ${new Date().toISOString()}\n\n`;
      const tables = [
        'users', 'accounts', 'categories', 'transactions', 'budgets', 'goals',
        'tags', 'account_types', 'app_settings', 'category_rules',
        'cashew_import_logs', 'audit_logs', 'exchange_rates', 'recurring_transactions', 'notifications'
      ];

      for (const t of tables) {
        try {
          const rows = await this.dataSource.query(`SELECT * FROM "${t}"`);
          if (rows.length > 0) {
            dumpSql += `-- Data for table ${t}\n`;
            for (const row of rows) {
              const cols = Object.keys(row).map((c) => `"${c}"`).join(', ');
              const vals = Object.values(row).map((v) => {
                if (v === null || v === undefined) return 'NULL';
                if (typeof v === 'number' || typeof v === 'boolean') return v;
                if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                return `'${String(v).replace(/'/g, "''")}'`;
              }).join(', ');
              dumpSql += `INSERT INTO "${t}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
            }
            dumpSql += `\n`;
          }
        } catch (e) {
          // Table may not exist
        }
      }
      fs.writeFileSync(filepath, dumpSql, 'utf8');
      return { dumpSql, filename, filepath };
    }
  }

  async getTransactions(userId: string, query?: ExportQueryDto): Promise<Transaction[]> {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    if (query?.search && query.search.trim() !== '' && query.search !== 'undefined') {
      qb.andWhere('(transaction.title ILIKE :search OR transaction.notes ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query?.accountId && query.accountId !== 'undefined') {
      qb.andWhere('transaction.accountId = :accountId', { accountId: query.accountId });
    }
    if (query?.type && query.type !== 'undefined') {
      if (query.type === 'transfer') {
        qb.andWhere('(transaction.type = \'transfer\' OR transaction.isTransfer = true)');
      } else if (query.type === 'expense') {
        qb.andWhere('transaction.type = \'expense\' AND (transaction.isTransfer IS NOT TRUE)');
      } else if (query.type === 'income') {
        qb.andWhere('transaction.type = \'income\' AND (transaction.isTransfer IS NOT TRUE)');
      } else {
        qb.andWhere('transaction.type = :type', { type: query.type });
      }
    }
    if (query?.from) {
      qb.andWhere('DATE(transaction.date) >= :from', { from: query.from });
    }
    if (query?.to) {
      qb.andWhere('DATE(transaction.date) <= :to', { to: query.to });
    }

    qb.orderBy('transaction.date', 'DESC').addOrderBy('transaction.createdAt', 'DESC');

    return qb.getMany();
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
