import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ImportService } from './import.service';
import { CashewImportLog, ImportStatus } from '../database/entities/cashew-import-log.entity';
import { Account } from '../database/entities/account.entity';
import { Category } from '../database/entities/category.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Budget } from '../database/entities/budget.entity';
import { BudgetCategory } from '../database/entities/budget-category.entity';
import { Goal } from '../database/entities/goal.entity';
import { CategoryRule } from '../database/entities/category-rule.entity';
import { AppSetting } from '../database/entities/app-setting.entity';
import Database = require('better-sqlite3');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('ImportService', () => {
  let service: ImportService;
  let importLogRepo: Repository<CashewImportLog>;
  let dataSource: DataSource;

  const mockImportLogRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'log-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn().mockImplementation(({ where: { id } }) => Promise.resolve({ id, status: ImportStatus.COMPLETED })),
  };

  const mockManager = {
    getRepository: jest.fn().mockImplementation((entityClass) => ({
      create: jest.fn().mockImplementation((dto) => ({ id: 'mock-id', ...dto })),
      save: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
      update: jest.fn().mockResolvedValue(true),
      findOne: jest.fn().mockResolvedValue(null),
    })),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: getRepositoryToken(CashewImportLog),
          useValue: mockImportLogRepo,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    importLogRepo = module.get<Repository<CashewImportLog>>(getRepositoryToken(CashewImportLog));
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a valid Cashew SQLite buffer and save import log', async () => {
    // Create temporary SQLite DB with Cashew tables
    const tmpDbPath = path.join(os.tmpdir(), `test-cashew-${Date.now()}.sqlite`);
    const db = new Database(tmpDbPath);

    db.exec(`
      CREATE TABLE wallets (wallet_pk TEXT, name TEXT, colour TEXT, icon_name TEXT, currency TEXT, date_created INTEGER);
      CREATE TABLE categories (category_pk TEXT, name TEXT, colour TEXT, icon_name TEXT, emoji_icon_name TEXT, income INTEGER, main_category_pk TEXT);
      CREATE TABLE transactions (transaction_pk TEXT, paired_transaction_fk TEXT, name TEXT, amount REAL, note TEXT, category_fk TEXT, sub_category_fk TEXT, wallet_fk TEXT, date_created INTEGER, income INTEGER, paid INTEGER, type INTEGER, reoccurrence INTEGER, period_length INTEGER, end_date INTEGER, original_date_due INTEGER, upcoming_transaction_notification INTEGER, skip_paid INTEGER, created_another_future_transaction INTEGER, method_added INTEGER, objective_fk TEXT, objective_loan_fk TEXT);
      CREATE TABLE budgets (budget_pk TEXT, name TEXT, amount REAL, colour TEXT, start_date INTEGER, end_date INTEGER, wallet_fks TEXT, category_fks TEXT, category_fks_exclude TEXT, income INTEGER, archived INTEGER, period_length INTEGER, reoccurrence INTEGER, pinned INTEGER, "order" INTEGER, wallet_fk TEXT, is_absolute_spending_limit INTEGER);
      CREATE TABLE category_budget_limits (category_limit_pk TEXT, category_fk TEXT, budget_fk TEXT, amount REAL, wallet_fk TEXT);
      CREATE TABLE objectives (objective_pk TEXT, type INTEGER, name TEXT, amount REAL, "order" INTEGER, colour TEXT, date_created INTEGER, end_date INTEGER, icon_name TEXT, emoji_icon_name TEXT, income INTEGER, pinned INTEGER, archived INTEGER, wallet_fk TEXT);
      CREATE TABLE associated_titles (associated_title_pk TEXT, category_fk TEXT, title TEXT, "order" INTEGER, is_exact_match INTEGER);
      CREATE TABLE app_settings (settings_pk INTEGER, settings_j_s_o_n TEXT, date_updated INTEGER);
      CREATE TABLE scanner_templates (scanner_template_pk TEXT);
      CREATE TABLE delete_logs (delete_log_pk TEXT);

      INSERT INTO wallets VALUES ('w1', 'Cash Wallet', '0xff4caf50', 'wallet', 'INR', 1700000000);
      INSERT INTO categories VALUES ('c1', 'Groceries', '0xff78909c', 'shopping', NULL, 0, NULL);
      INSERT INTO transactions VALUES ('t1', NULL, 'Supermarket', 500.0, 'Weekly groceries', 'c1', NULL, 'w1', 1700000050, 0, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    `);
    db.close();

    const fileBuffer = fs.readFileSync(tmpDbPath);
    fs.unlinkSync(tmpDbPath);

    const result = await service.processCashewFile(fileBuffer, 'user-123', 'test-export.sql');

    expect(result).toBeDefined();
    expect(result.logId).toBe('log-uuid-1');
    expect(result.status).toBe(ImportStatus.COMPLETED);
    expect(result.report.totals.walletsFound).toBe(1);
    expect(result.report.totals.categoriesFound).toBe(1);
    expect(result.report.totals.transactionsFound).toBe(1);
  });

  it('should retrieve import status by ID', async () => {
    const log = await service.getImportStatus('log-uuid-1');
    expect(log).toBeDefined();
    expect(log?.id).toBe('log-uuid-1');
  });
});
