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
    const [accounts, transactions, budgets, debts] = await Promise.all([
      this.accountRepo.find({ where: { userId } }),
      this.transactionRepo.find({ where: { userId } }),
      this.budgetRepo.find({ where: { userId } }),
      this.debtRepo.find({ where: { userId } }),
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // 1. Calculate Liquid Emergency Savings (Savings, Checking, Cash accounts)
    const liquidSavings = accounts
      .filter((a) => {
        const nameLower = a.name.toLowerCase();
        const typeLower = (a.type || '').toLowerCase();
        return (
          typeLower.includes('savings') ||
          typeLower.includes('checking') ||
          typeLower.includes('cash') ||
          nameLower.includes('saving') ||
          nameLower.includes('cash') ||
          nameLower.includes('bank')
        );
      })
      .reduce((sum, a: any) => sum + (Number(a.currentBalance ?? a.balance ?? 0)), 0);

    // 2. Compute Current Month & Previous Month Financials
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let prevMonthExpense = 0;

    const currentCatExpenses: Record<string, number> = {};
    const prevCatExpenses: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
      const d = new Date(tx.date);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const amt = Math.abs(Number(tx.amount) || 0);
      const isInc = tx.type === 'income' || (tx as any).income === 1;

      if (mKey === currentMonthKey) {
        if (isInc) {
          currentMonthIncome += amt;
        } else {
          currentMonthExpense += amt;
          const cat = typeof tx.category === 'object' ? (tx.category as any)?.name || 'General' : tx.category || 'General';
          currentCatExpenses[cat] = (currentCatExpenses[cat] || 0) + amt;
        }
      } else if (mKey === prevMonthKey) {
        if (!isInc) {
          prevMonthExpense += amt;
          const cat = typeof tx.category === 'object' ? (tx.category as any)?.name || 'General' : tx.category || 'General';
          prevCatExpenses[cat] = (prevCatExpenses[cat] || 0) + amt;
        }
      }
    });

    const avgMonthlyExpense = currentMonthExpense > 0 ? currentMonthExpense : (prevMonthExpense > 0 ? prevMonthExpense : 1);

    // Metric A: Emergency Fund Coverage (Target: 3-6 months)
    const emergencyMonths = Number((liquidSavings / Math.max(1, avgMonthlyExpense)).toFixed(1));
    const emergencyScore = Math.min(25, Math.round((emergencyMonths / 6) * 25));

    // Metric B: Debt-to-Income (DTI) Ratio (Target: < 36%)
    const monthlyDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minimumPayment) + Number(d.extraPayment || 0)), 0);
    const dtiRatio = currentMonthIncome > 0 ? Number(((monthlyDebtPayments / currentMonthIncome) * 100).toFixed(1)) : (monthlyDebtPayments > 0 ? 50 : 0);
    const dtiScore = dtiRatio <= 20 ? 25 : dtiRatio <= 36 ? 20 : dtiRatio <= 50 ? 10 : 0;

    // Metric C: Savings Rate Benchmark (Target: >= 20%)
    const netSavings = currentMonthIncome - currentMonthExpense;
    const savingsRate = currentMonthIncome > 0 ? Math.max(0, Number(((netSavings / currentMonthIncome) * 100).toFixed(1))) : 0;
    const savingsScore = Math.min(25, Math.round((savingsRate / 20) * 25));

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
    } else {
      insights.push({
        type: 'warning',
        title: 'Emergency Fund Alert',
        description: `Emergency fund covers only ${emergencyMonths} months of expenses. Aim to build 3-6 months buffer.`,
      });
    }

    // Insight 3: Savings rate benchmark
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'High Savings Rate',
        description: `You saved ${savingsRate}% of your income this month, exceeding the 20% benchmark!`,
      });
    } else if (currentMonthIncome > 0) {
      insights.push({
        type: 'info',
        title: 'Savings Benchmark Notice',
        description: `Current savings rate is ${savingsRate}%. Increasing savings by ₹${Math.round((currentMonthIncome * 0.2) - netSavings).toLocaleString()} reaches 20%.`,
      });
    }

    // Insight 4: DTI status
    if (dtiRatio === 0) {
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
        currentMonthIncome,
        currentMonthExpense,
        monthlyDebtPayments,
      },
      insights,
    };
  }
}
