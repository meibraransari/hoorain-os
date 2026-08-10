import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { Transaction, TransactionType } from '../database/entities/transaction.entity';
import { DateRangeQueryDto } from './dto/date-range-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  private applyDateRange(qb: SelectQueryBuilder<Transaction>, query: DateRangeQueryDto): void {
    if (query.from) {
      qb.andWhere('transaction.date >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('transaction.date <= :to', { to: query.to });
    }
  }

  async getNetWorth(userId: string) {
    const result = await this.accountRepo
      .createQueryBuilder('account')
      .select('COALESCE(SUM(account.currentBalance), 0)', 'netWorth')
      .where('account.userId = :userId', { userId })
      .andWhere('account.includeInNetWorth = true')
      .getRawOne();

    return { netWorth: Number(result?.netWorth ?? 0) };
  }

  async getCashFlow(userId: string, query: DateRangeQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type IN (:...types)', {
        types: [TransactionType.INCOME, TransactionType.EXPENSE],
      });

    this.applyDateRange(qb, query);
    qb.groupBy('transaction.type');

    const rows = await qb.getRawMany();
    const income = Number(rows.find((row) => row.type === TransactionType.INCOME)?.total ?? 0);
    const expense = Number(rows.find((row) => row.type === TransactionType.EXPENSE)?.total ?? 0);

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      income,
      expense,
      net: income - expense,
    };
  }

  async getByCategory(userId: string, query: DateRangeQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .select('transaction.categoryId', 'categoryId')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'total')
      .addSelect('COUNT(transaction.id)', 'count')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: TransactionType.EXPENSE });

    this.applyDateRange(qb, query);
    qb.groupBy('transaction.categoryId');

    const rows = await qb.getRawMany();

    return rows.map((row) => ({
      categoryId: row.categoryId,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }
}
