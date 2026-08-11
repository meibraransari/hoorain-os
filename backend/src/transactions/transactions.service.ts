import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Goal } from '../database/entities/goal.entity';
import { Budget } from '../database/entities/budget.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
  ) {}

  async onModuleInit() {
    try {
      await this.transactionRepo.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS goal_id UUID;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_id UUID;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exclude_from_balance BOOLEAN DEFAULT FALSE;

        CREATE OR REPLACE FUNCTION sync_account_balance()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            IF NEW.exclude_from_balance IS TRUE THEN
              RETURN COALESCE(NEW, OLD);
            END IF;
            IF NEW.type = 'income' THEN
              UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
              UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF OLD.exclude_from_balance IS TRUE THEN
              RETURN COALESCE(NEW, OLD);
            END IF;
            IF OLD.type = 'income' THEN
              UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
              UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
          ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.exclude_from_balance IS NOT TRUE THEN
              IF OLD.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
              ELSIF OLD.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
              END IF;
            END IF;
            IF NEW.exclude_from_balance IS NOT TRUE THEN
              IF NEW.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
              ELSIF NEW.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
              END IF;
            END IF;
          END IF;
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_sync_account_balance ON transactions;
        CREATE TRIGGER trg_sync_account_balance
        AFTER INSERT OR UPDATE OR DELETE ON transactions
        FOR EACH ROW EXECUTE FUNCTION sync_account_balance();
      `);
    } catch (err) {
      console.error('TransactionsService init columns & trigger error:', err);
    }
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 2000);

    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.budget', 'budget')
      .leftJoinAndSelect('transaction.goal', 'goal')
      .where('transaction.userId = :userId', { userId });

    if (query.search && query.search.trim() !== '' && query.search !== 'undefined') {
      qb.andWhere('(transaction.title ILIKE :search OR transaction.notes ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query.accountId && query.accountId !== 'undefined') {
      qb.andWhere('transaction.accountId = :accountId', { accountId: query.accountId });
    }
    if (query.categoryId && query.categoryId !== 'undefined') {
      qb.andWhere('transaction.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.type && query.type !== 'undefined') {
      if ((query.type as string) === 'transfer') {
        qb.andWhere('(transaction.type = \'transfer\' OR transaction.isTransfer = true)');
      } else if ((query.type as string) === 'expense') {
        qb.andWhere('transaction.type = \'expense\' AND (transaction.isTransfer IS NOT TRUE)');
      } else if ((query.type as string) === 'income') {
        qb.andWhere('transaction.type = \'income\' AND (transaction.isTransfer IS NOT TRUE)');
      } else {
        qb.andWhere('transaction.type = :type', { type: query.type });
      }
    }
    if (query.from) {
      qb.andWhere('DATE(transaction.date) >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('DATE(transaction.date) <= :to', { to: query.to });
    }

    // Compute period summary totals for all matching transactions (unpaginated)
    let periodIncome = 0;
    let periodExpense = 0;

    try {
      const summaryQb = this.transactionRepo
        .createQueryBuilder('transaction')
        .select(
          "SUM(CASE WHEN transaction.type = 'income' AND (transaction.isTransfer IS NOT TRUE OR transaction.isTransfer IS NULL) THEN transaction.amount ELSE 0 END)",
          'income'
        )
        .addSelect(
          "SUM(CASE WHEN transaction.type = 'expense' AND (transaction.isTransfer IS NOT TRUE OR transaction.isTransfer IS NULL) THEN transaction.amount ELSE 0 END)",
          'expense'
        )
        .where('transaction.userId = :userId', { userId });

      if (query.search && query.search.trim() !== '' && query.search !== 'undefined') {
        summaryQb.andWhere('(transaction.title ILIKE :search OR transaction.notes ILIKE :search)', { search: `%${query.search}%` });
      }
      if (query.accountId && query.accountId !== 'undefined') {
        summaryQb.andWhere('transaction.accountId = :accountId', { accountId: query.accountId });
      }
      if (query.categoryId && query.categoryId !== 'undefined') {
        summaryQb.andWhere('transaction.categoryId = :categoryId', { categoryId: query.categoryId });
      }
      if (query.type && query.type !== 'undefined') {
        if ((query.type as string) === 'transfer') {
          summaryQb.andWhere('(transaction.type = \'transfer\' OR transaction.isTransfer = true)');
        } else if ((query.type as string) === 'expense') {
          summaryQb.andWhere('transaction.type = \'expense\' AND (transaction.isTransfer IS NOT TRUE)');
        } else if ((query.type as string) === 'income') {
          summaryQb.andWhere('transaction.type = \'income\' AND (transaction.isTransfer IS NOT TRUE)');
        } else {
          summaryQb.andWhere('transaction.type = :type', { type: query.type });
        }
      }
      if (query.from) {
        summaryQb.andWhere('DATE(transaction.date) >= :from', { from: query.from });
      }
      if (query.to) {
        summaryQb.andWhere('DATE(transaction.date) <= :to', { to: query.to });
      }

      const summaryRaw = await summaryQb.getRawOne();
      periodIncome = parseFloat(summaryRaw?.income || '0') || 0;
      periodExpense = parseFloat(summaryRaw?.expense || '0') || 0;
    } catch (summaryErr) {
      console.error('Error calculating period summary in TransactionsService:', summaryErr);
    }

    const [items, total] = await qb
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      summary: {
        income: periodIncome,
        expense: periodExpense,
        net: periodIncome - periodExpense,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, userId },
      relations: ['splits', 'transactionTags', 'attachments'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }

  private async assertAccountOwnership(accountId: string, userId: string): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { id: accountId, userId } });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
  }

  async syncGoalProgress(userId: string, goalId?: string, amount?: number, type?: string) {
    if (!goalId || !amount) return;
    const goal = await this.goalRepo.findOne({ where: { id: goalId, userId } });
    if (!goal) return;

    const amt = Number(amount);
    const goalType = goal.type || 'income';

    if (goalType === 'expense') {
      if (type === 'expense') {
        goal.currentAmount = Number(goal.currentAmount) + amt;
      } else if (type === 'income') {
        goal.currentAmount = Math.max(0, Number(goal.currentAmount) - amt);
      }
    } else {
      if (type === 'income') {
        goal.currentAmount = Number(goal.currentAmount) + amt;
      } else if (type === 'expense') {
        goal.currentAmount = Math.max(0, Number(goal.currentAmount) - amt);
      }
    }

    goal.isCompleted = Number(goal.currentAmount) >= Number(goal.targetAmount);
    await this.goalRepo.save(goal);
  }

  async syncBudgetProgress(userId: string, budgetId?: string, amount?: number, type?: string) {
    if (!budgetId || !amount) return;
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) return;

    const amt = Number(amount);
    if (type === 'expense') {
      budget.spentAmount = Number(budget.spentAmount || 0) + amt;
    } else if (type === 'income') {
      budget.spentAmount = Math.max(0, Number(budget.spentAmount || 0) - amt);
    }

    await this.budgetRepo.save(budget);
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.assertAccountOwnership(dto.accountId, userId);

    const transaction = this.transactionRepo.create({ ...dto, userId });
    const saved = await this.transactionRepo.save(transaction);

    if (dto.goalId) {
      await this.syncGoalProgress(userId, dto.goalId, dto.amount, dto.type);
    }
    if (dto.budgetId) {
      await this.syncBudgetProgress(userId, dto.budgetId, dto.amount, dto.type);
    }

    return saved;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    if (dto.accountId) {
      await this.assertAccountOwnership(dto.accountId, userId);
    }

    Object.assign(transaction, dto);
    const saved = await this.transactionRepo.save(transaction);

    if (dto.goalId) {
      await this.syncGoalProgress(userId, dto.goalId, dto.amount, dto.type);
    }
    if (dto.budgetId) {
      await this.syncBudgetProgress(userId, dto.budgetId, dto.amount, dto.type);
    }

    return saved;
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const transaction = await this.findOne(id, userId);
    await this.transactionRepo.remove(transaction);
    return { id, deleted: true };
  }
}
