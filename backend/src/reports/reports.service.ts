import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Account, AccountType } from '../database/entities/account.entity';
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

  async getProfitLoss(userId: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentTxs = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.date >= :start AND transaction.date <= :end', {
        start: currentMonthStart.toISOString(),
        end: currentMonthEnd.toISOString(),
      })
      .andWhere('transaction.isTransfer = false')
      .getMany();

    let grossRevenue = 0;
    let operatingExpenses = 0;
    currentTxs.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount) || 0);
      if (tx.type === TransactionType.INCOME) grossRevenue += amt;
      else if (tx.type === TransactionType.EXPENSE) operatingExpenses += amt;
    });

    const prevTxs = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.date >= :start AND transaction.date <= :end', {
        start: prevMonthStart.toISOString(),
        end: prevMonthEnd.toISOString(),
      })
      .andWhere('transaction.isTransfer = false')
      .getMany();

    let prevRevenue = 0;
    let prevExpenses = 0;
    prevTxs.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount) || 0);
      if (tx.type === TransactionType.INCOME) prevRevenue += amt;
      else if (tx.type === TransactionType.EXPENSE) prevExpenses += amt;
    });

    const netOperatingProfit = grossRevenue - operatingExpenses;
    const prevNetProfit = prevRevenue - prevExpenses;

    const netMarginPercentage = grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;
    const momRevenueGrowth = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const momExpenseGrowth = prevExpenses > 0 ? ((operatingExpenses - prevExpenses) / prevExpenses) * 100 : 0;
    const momProfitGrowth = prevNetProfit !== 0 ? ((netOperatingProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;

    return {
      grossRevenue,
      operatingExpenses,
      netOperatingProfit,
      netMarginPercentage: Number(netMarginPercentage.toFixed(1)),
      momRevenueGrowth: Number(momRevenueGrowth.toFixed(1)),
      momExpenseGrowth: Number(momExpenseGrowth.toFixed(1)),
      momProfitGrowth: Number(momProfitGrowth.toFixed(1)),
      previousMonth: {
        grossRevenue: prevRevenue,
        operatingExpenses: prevExpenses,
        netOperatingProfit: prevNetProfit,
      },
    };
  }

  async getCreditUtilization(userId: string) {
    const accounts = await this.accountRepo.find({
      where: { userId, isActive: true },
    });

    const creditAccounts = accounts.filter(
      (a) => a.type === AccountType.CREDIT_CARD || a.type === AccountType.LOAN || (Number(a.creditLimit) || 0) > 0,
    );

    let totalCreditLimit = 0;
    let totalCreditUsed = 0;

    const perCardBreakdown = creditAccounts.map((card) => {
      const limit = Number(card.creditLimit) || 0;
      const bal = Math.abs(Number(card.currentBalance) || 0);
      const utilPct = limit > 0 ? (bal / limit) * 100 : 0;

      totalCreditLimit += limit;
      totalCreditUsed += bal;

      let safetyBadge: 'ideal' | 'warning' | 'danger' = 'ideal';
      if (utilPct > 70) safetyBadge = 'danger';
      else if (utilPct >= 30) safetyBadge = 'warning';

      return {
        id: card.id,
        name: card.name,
        type: card.type,
        currentBalance: bal,
        creditLimit: limit,
        utilizationPercentage: Number(utilPct.toFixed(1)),
        safetyBadge,
      };
    });

    const overallUtilPct = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
    let overallSafetyStatus: 'ideal' | 'warning' | 'danger' = 'ideal';
    if (overallUtilPct > 70) overallSafetyStatus = 'danger';
    else if (overallUtilPct >= 30) overallSafetyStatus = 'warning';

    return {
      totalCreditLimit,
      totalCreditUsed,
      overallUtilizationPercentage: Number(overallUtilPct.toFixed(1)),
      overallSafetyStatus,
      perCardBreakdown,
    };
  }
}

