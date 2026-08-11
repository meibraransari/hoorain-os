import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Budget } from '../database/entities/budget.entity';
import { Debt } from '../database/entities/debt.entity';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Debt)
    private readonly debtRepo: Repository<Debt>,
  ) {}

  async getHealthScoreAndInsights(userId: string): Promise<any> {
    // 1. Fetch User Accounts & Calculate Dynamic Balances
    const accounts = await this.accountRepo.find({ where: { userId, isActive: true } });
    for (const acc of accounts) {
      const [{ sum }] = await this.accountRepo.query(
        `SELECT SUM(
          CASE 
            WHEN type = 'income' THEN amount 
            WHEN type = 'expense' THEN -amount 
            ELSE 0 
          END
        ) as sum FROM transactions WHERE account_id = $1 AND (exclude_from_balance IS NOT TRUE OR exclude_from_balance IS NULL)`,
        [acc.id],
      );
      const txSum = parseFloat(sum || '0');
      acc.currentBalance = parseFloat(acc.initialBalance as any || '0') + txSum;
    }

    // 2. Fetch User Transactions (linked via userId OR account.userId)
    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId OR account.userId = :userId', { userId })
      .getMany();

    // 3. Fetch Budgets & Debts
    const budgets = await this.budgetRepo.find({ where: { userId } });
    const debts = await this.debtRepo.find({ where: { userId } });

    const hasData = accounts.length > 0 || transactions.length > 0 || budgets.length > 0 || debts.length > 0;

    if (!hasData) {
      return {
        healthScore: 0,
        ratingLabel: 'No Financial Data',
        ratingColor: 'text-[#8888a8]',
        metrics: {
          emergencyMonths: 0,
          emergencyScore: 0,
          dtiRatio: 0,
          dtiScore: 0,
          savingsRate: 0,
          savingsScore: 0,
          budgetScore: 0,
          liquidSavings: 0,
          currentMonthIncome: 0,
          currentMonthExpense: 0,
          monthlyDebtPayments: 0,
        },
        insights: [
          {
            type: 'info',
            title: 'No Financial Data Logged',
            description: 'Start by adding your bank or cash accounts, or log transactions to calculate your real AI Financial Health Index.',
          },
        ],
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // Calculate Liquid Emergency Savings (Bank, Cash, Savings, Checking, Wallet, Debit Card accounts)
    const liquidSavings = accounts
      .filter((a) => {
        const t = (a.type || '').toLowerCase();
        return (
          t !== 'credit_card' &&
          t !== 'loan' &&
          t !== 'investment' &&
          t !== 'crypto' &&
          a.includeInNetWorth !== false
        );
      })
      .reduce((sum, a: any) => sum + Math.max(0, Number(a.currentBalance ?? a.balance ?? 0)), 0);

    // Compute Income & Expense Velocity
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;

    const monthlyTotals: Record<string, { income: number; expense: number }> = {};
    const currentCatExpenses: Record<string, number> = {};
    const prevCatExpenses: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const amt = Math.abs(Number(tx.amount) || 0);
      const isInc = tx.type === 'income' || (tx as any).income === 1;

      if (!monthlyTotals[mKey]) {
        monthlyTotals[mKey] = { income: 0, expense: 0 };
      }

      if (isInc) {
        totalAllTimeIncome += amt;
        monthlyTotals[mKey].income += amt;
        if (mKey === currentMonthKey) currentMonthIncome += amt;
      } else {
        totalAllTimeExpense += amt;
        monthlyTotals[mKey].expense += amt;
        if (mKey === currentMonthKey) {
          currentMonthExpense += amt;
          const cat = typeof tx.category === 'object' ? (tx.category as any)?.name || 'General' : tx.category || 'General';
          currentCatExpenses[cat] = (currentCatExpenses[cat] || 0) + amt;
        } else if (mKey === prevMonthKey) {
          const cat = typeof tx.category === 'object' ? (tx.category as any)?.name || 'General' : tx.category || 'General';
          prevCatExpenses[cat] = (prevCatExpenses[cat] || 0) + amt;
        }
      }
    });

    // Effective income & expense fallback for multi-month or historical data
    const monthKeys = Object.keys(monthlyTotals).sort().reverse();
    const activeMonthKey = currentMonthIncome > 0 || currentMonthExpense > 0 ? currentMonthKey : (monthKeys[0] || currentMonthKey);
    const effectiveIncome = monthlyTotals[activeMonthKey]?.income ?? (monthKeys.length > 0 ? totalAllTimeIncome / monthKeys.length : currentMonthIncome);
    const effectiveExpense = monthlyTotals[activeMonthKey]?.expense ?? (monthKeys.length > 0 ? totalAllTimeExpense / monthKeys.length : currentMonthExpense);

    const avgMonthlyExpense = effectiveExpense > 0 ? effectiveExpense : 1;

    // Metric A: Emergency Fund Coverage (Target: 3-6 months)
    const emergencyMonths = liquidSavings > 0 ? Number((liquidSavings / avgMonthlyExpense).toFixed(1)) : 0;
    const emergencyScore = Math.min(25, Math.round((emergencyMonths / 6) * 25));

    // Metric B: Debt-to-Income (DTI) Ratio (Target: < 36%)
    const monthlyDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minimumPayment || 0) + Number(d.extraPayment || 0)), 0);
    const dtiRatio = effectiveIncome > 0 ? Number(((monthlyDebtPayments / effectiveIncome) * 100).toFixed(1)) : (monthlyDebtPayments > 0 ? 50 : 0);
    const dtiScore = monthlyDebtPayments === 0 ? 25 : (dtiRatio <= 20 ? 25 : dtiRatio <= 36 ? 20 : dtiRatio <= 50 ? 10 : 0);

    // Metric C: Savings Rate Benchmark (Target: >= 20%)
    const netSavings = effectiveIncome - effectiveExpense;
    const savingsRate = effectiveIncome > 0 ? Math.max(0, Number(((netSavings / effectiveIncome) * 100).toFixed(1))) : 0;
    const savingsScore = effectiveIncome > 0 ? Math.min(25, Math.round((savingsRate / 20) * 25)) : (liquidSavings > 0 ? 20 : 0);

    // Metric D: Budget Adherence Score
    let budgetScore = 25;
    if (budgets.length > 0) {
      const withinBudgetCount = budgets.filter((b: any) => Number(b.spent || 0) <= Number(b.amount || 0)).length;
      budgetScore = Math.round((withinBudgetCount / budgets.length) * 25);
    }

    // Total Health Score (0-100)
    const healthScore = Math.min(100, Math.max(0, emergencyScore + dtiScore + savingsScore + budgetScore));

    // Health Rating Label
    let ratingLabel = 'Needs Improvement';
    let ratingColor = 'text-rose-400';
    if (healthScore >= 80) {
      ratingLabel = 'Excellent';
      ratingColor = 'text-emerald-400';
    } else if (healthScore >= 65) {
      ratingLabel = 'Good';
      ratingColor = 'text-teal-300';
    } else if (healthScore >= 50) {
      ratingLabel = 'Fair';
      ratingColor = 'text-amber-300';
    }

    // Smart Spending Insights Generator
    const insights: any[] = [];

    // Insight 1: Category spending spikes
    Object.keys(currentCatExpenses).forEach((cat) => {
      const currAmt = currentCatExpenses[cat];
      const prevAmt = prevCatExpenses[cat] || 0;
      if (prevAmt > 0 && currAmt > prevAmt * 1.25 && currAmt - prevAmt > 500) {
        const percentIncrease = Math.round(((currAmt - prevAmt) / prevAmt) * 100);
        insights.push({
          type: 'warning',
          category: cat,
          title: `${cat} Expense Spike`,
          description: `${cat} spending increased by ${percentIncrease}% compared to last month (₹${currAmt.toLocaleString()} vs ₹${prevAmt.toLocaleString()}).`,
        });
      }
    });

    // Insight 2: Emergency fund status
    if (emergencyMonths >= 6) {
      insights.push({
        type: 'success',
        title: 'Robust Emergency Shield',
        description: `Your liquid emergency fund covers ${emergencyMonths} months of expenses, exceeding the 6-month benchmark!`,
      });
    } else if (emergencyMonths >= 3) {
      insights.push({
        type: 'info',
        title: 'Solid Emergency Coverage',
        description: `Your emergency fund covers ${emergencyMonths} months of expenses (Target: 3 to 6 months).`,
      });
    } else if (emergencyMonths > 0) {
      insights.push({
        type: 'warning',
        title: 'Emergency Fund Alert',
        description: `Emergency fund covers ${emergencyMonths} months of expenses. Aim to build 3-6 months buffer.`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Emergency Fund Notice',
        description: 'No liquid savings detected. Consider allocating surplus to a liquid emergency account.',
      });
    }

    // Insight 3: Savings rate benchmark
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'High Savings Rate',
        description: `You saved ${savingsRate}% of your income, exceeding the 20% benchmark!`,
      });
    } else if (effectiveIncome > 0) {
      insights.push({
        type: 'info',
        title: 'Savings Benchmark Notice',
        description: `Current savings rate is ${savingsRate}%. Increasing savings by ₹${Math.round((effectiveIncome * 0.2) - netSavings).toLocaleString()} reaches 20%.`,
      });
    }

    // Insight 4: DTI status
    if (monthlyDebtPayments === 0) {
      insights.push({
        type: 'success',
        title: 'Zero Debt Load',
        description: 'You currently have zero debt obligations reported, maximizing your financial freedom!',
      });
    } else if (dtiRatio <= 36) {
      insights.push({
        type: 'success',
        title: 'Healthy Debt Ratio',
        description: `Debt-to-income ratio is ${dtiRatio}%, well within the safe 36% limit.`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Elevated Debt Load',
        description: `Debt-to-income ratio is ${dtiRatio}%. Consider using Debt Avalanche to pay off high-APR loans.`,
      });
    }

    return {
      healthScore,
      ratingLabel,
      ratingColor,
      metrics: {
        emergencyMonths,
        emergencyScore,
        dtiRatio,
        dtiScore,
        savingsRate,
        savingsScore,
        budgetScore,
        liquidSavings,
        currentMonthIncome: effectiveIncome,
        currentMonthExpense: effectiveExpense,
        monthlyDebtPayments,
      },
      insights,
    };
  }
}
