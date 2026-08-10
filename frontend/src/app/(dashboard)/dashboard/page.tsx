'use client';

import { useState, useMemo } from 'react';
import { useAccounts, useTransactions, useBudgets } from '@/lib/hooks/useFinance';
import { StatCard } from '@/components/ui/StatCard';
import { AreaChart } from '@/components/charts/AreaChart';
import { PieChart } from '@/components/charts/PieChart';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { BudgetCard } from '@/components/ui/BudgetCard';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { Wallet, TrendingUp, TrendingDown, Target, Plus, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { PrivacyToggle } from '@/components/ui/PrivacyToggle';
import Link from 'next/link';

export default function DashboardPage() {
  const { isPrivate, formatPrivateCurrency, formatPrivateNumber } = usePrivacy();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { transactions, isLoading: txLoading } = useTransactions({ limit: 2000 });
  const { budgets, isLoading: budgetLoading } = useBudgets();

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'thisMonth' | 'monthlyTrend'>('thisMonth');

  // Compute Net Worth, Assets and Liabilities breakdown respecting Net Worth exclusions
  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;

    accounts.forEach((acc: any) => {
      if (acc.includeInNetWorth === false) return;
      const bal = typeof acc.currentBalance === 'number' ? acc.currentBalance : parseFloat(acc.currentBalance || acc.balance) || 0;
      if (bal >= 0) {
        assets += bal;
      } else {
        liabilities += Math.abs(bal);
      }
    });

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: assets - liabilities,
    };
  }, [accounts]);

  // Determine current month target key (e.g. '2026-08')
  const currentMonthKey = useMemo(() => {
    if (transactions.length === 0) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const dates = transactions.map((t: any) => t.date ? new Date(t.date).toISOString().substring(0, 7) : '').filter(Boolean);
    return dates.length > 0 ? dates.sort().reverse()[0] : '2026-08';
  }, [transactions]);

  // THIS MONTH Income
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || !tx.date) return false;
        const d = new Date(tx.date).toISOString().substring(0, 7);
        return d === currentMonthKey && (tx.type === 'income' || tx.income === 1);
      })
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentMonthKey]);

  // THIS MONTH Expense
  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || !tx.date) return false;
        const d = new Date(tx.date).toISOString().substring(0, 7);
        return d === currentMonthKey && (tx.type === 'expense' || tx.income === 0);
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentMonthKey]);

  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)) : 0;

  // Format readable month title (e.g. "August 2026")
  const currentMonthLabel = useMemo(() => {
    const [year, month] = currentMonthKey.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthKey]);

  // Compute Cash Flow Chart Data (This Month Daily View vs 12-Month Trend)
  const chartData = useMemo(() => {
    if (chartTimeframe === 'thisMonth') {
      const [yearStr, monthStr] = currentMonthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const daysInMonth = new Date(year, month, 0).getDate();

      const dailyMap: Record<number, { income: number; expense: number }> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dailyMap[day] = { income: 0, expense: 0 };
      }

      transactions.forEach((tx: any) => {
        if (tx.isTransfer || !tx.date) return;
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return;
        const txMonthKey = d.toISOString().substring(0, 7);
        if (txMonthKey !== currentMonthKey) return;

        const day = d.getDate();
        const amt = Math.abs(parseFloat(tx.amount) || 0);

        if (tx.type === 'income' || tx.income === 1) {
          dailyMap[day].income += amt;
        } else if (tx.type === 'expense' || tx.income === 0) {
          dailyMap[day].expense += amt;
        }
      });

      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });

      return Object.entries(dailyMap).map(([dayStr, data]) => ({
        name: `${monthName} ${dayStr}`,
        income: Math.round(data.income),
        expense: Math.round(data.expense),
      }));
    } else {
      const monthlyMap: Record<string, { income: number; expense: number; sortKey: string }> = {};
      const sortedTxs = [...transactions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedTxs.forEach((tx: any) => {
        if (tx.isTransfer || !tx.date) return;
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return;

        const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const sortKey = d.toISOString().substring(0, 7);

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { income: 0, expense: 0, sortKey };
        }

        const amt = Math.abs(parseFloat(tx.amount) || 0);
        if (tx.type === 'income' || tx.income === 1) {
          monthlyMap[monthKey].income += amt;
        } else if (tx.type === 'expense' || tx.income === 0) {
          monthlyMap[monthKey].expense += amt;
        }
      });

      const entries = Object.entries(monthlyMap).sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey));
      const recent = entries.slice(-12);

      return recent.map(([name, data]) => ({
        name,
        income: Math.round(data.income),
        expense: Math.round(data.expense),
      }));
    }
  }, [transactions, chartTimeframe, currentMonthKey]);

  // Aggregate spending by category strictly for THIS MONTH with counts & percentages
  const categoryData = useMemo(() => {
    const thisMonthTxs = transactions.filter((tx: any) => {
      if (tx.isTransfer || !tx.date) return false;
      const d = new Date(tx.date).toISOString().substring(0, 7);
      return d === currentMonthKey && (tx.type === 'expense' || tx.income === 0);
    });

    const targetTxs = thisMonthTxs.length > 0 ? thisMonthTxs : transactions.filter((tx: any) => (tx.type === 'expense' || tx.income === 0) && !tx.isTransfer);

    const categoryStats: Record<string, { total: number; count: number }> = {};
    targetTxs.forEach((tx: any) => {
      const catName = typeof tx.category === 'string' ? tx.category : tx.category?.name || tx.title || 'General';
      if (!categoryStats[catName]) {
        categoryStats[catName] = { total: 0, count: 0 };
      }
      categoryStats[catName].total += Math.abs(parseFloat(tx.amount) || 0);
      categoryStats[catName].count += 1;
    });

    const totalExp = Object.values(categoryStats).reduce((s, c) => s + c.total, 0);

    const categoryColors = ['#6c63ff', '#ffb84d', '#10d88a', '#ff4d6d', '#00f2fe', '#f39c12', '#9b59b6'];

    return Object.entries(categoryStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data], i) => ({
        name,
        value: Math.round(data.total),
        count: data.count,
        percentage: totalExp > 0 ? Math.round((data.total / totalExp) * 1000) / 10 : 0,
        color: categoryColors[i % categoryColors.length],
      }));
  }, [transactions, currentMonthKey]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold text-text-primary">Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
              <Calendar size={12} />
              {currentMonthLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-text-secondary">Here is your financial performance for {currentMonthLabel}.</p>
            <PrivacyToggle />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddTxOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth Card */}
        <CollapsibleCard
          title={
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-text-muted">Net Worth</span>
            </div>
          }
          action={
            <div className="p-2 bg-accent/10 text-accent rounded-xl">
              <Wallet size={18} />
            </div>
          }
        >
          <div>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-text-primary' : 'text-expense'}`}>
              {formatPrivateCurrency(netWorth)}
            </div>
            <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-border">
              <span className="text-income font-medium flex items-center gap-0.5">
                <ArrowUpRight size={13} /> Assets: {formatPrivateCurrency(totalAssets)}
              </span>
              <span className="text-expense font-medium flex items-center gap-0.5">
                <ArrowDownRight size={13} /> Debt: {formatPrivateCurrency(totalLiabilities)}
              </span>
            </div>
          </div>
          {totalLiabilities > 0 && (
            <Link
              href="/accounts"
              className="flex items-center gap-1 text-[11px] text-accent hover:underline pt-2 block"
            >
              <AlertCircle size={12} />
              <span>Edit account initial balances to adjust Net Worth</span>
            </Link>
          )}
        </CollapsibleCard>

        <StatCard
          title={`Income (${currentMonthLabel})`}
          value={formatPrivateCurrency(monthlyIncome)}
          icon={<TrendingUp size={20} className="text-income" />}
          trend="This Month"
          trendType="up"
          isLoading={txLoading}
        />
        <StatCard
          title={`Expenses (${currentMonthLabel})`}
          value={formatPrivateCurrency(monthlyExpense)}
          icon={<TrendingDown size={20} className="text-expense" />}
          trend="This Month"
          trendType="down"
          isLoading={txLoading}
        />
        <StatCard
          title="Savings Rate"
          value={formatPrivateNumber(savingsRate, '%')}
          icon={<Target size={20} className="text-accent" />}
          subtitle="Target: 20%"
          isLoading={txLoading}
        />
      </div>

      {/* Integrated Masonry Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column (2 Spans): Cash Flow Analysis + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Cash Flow Analysis Chart */}
          <AreaChart 
            data={chartData} 
            title={chartTimeframe === 'thisMonth' ? `Daily Cash Flow (${currentMonthLabel})` : '12-Month Cash Flow Trend'} 
            height={320}
            action={
              <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border">
                <button
                  onClick={() => setChartTimeframe('thisMonth')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartTimeframe === 'thisMonth'
                      ? 'bg-accent text-white shadow'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  This Month (Daily)
                </button>
                <button
                  onClick={() => setChartTimeframe('monthlyTrend')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartTimeframe === 'monthlyTrend'
                      ? 'bg-accent text-white shadow'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  12-Month Trend
                </button>
              </div>
            }
          />

          {/* 2. Recent Transactions */}
          <CollapsibleCard
            title={`Recent Transactions (${currentMonthLabel})`}
            action={
              <Link href="/transactions" className="text-xs font-semibold text-accent hover:underline">
                View All
              </Link>
            }
          >
            {txLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No transactions recorded yet. Click "Add Transaction" or import your Cashew backup.
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 7).map((tx: any) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            )}
          </CollapsibleCard>
        </div>

        {/* Right Column (1 Span): Top Expenses + Monthly Budgets */}
        <div className="space-y-6">
          {/* 1. Top Expenses Donut Widget */}
          <PieChart data={categoryData} title={`Top Expenses (${currentMonthLabel})`} />

          {/* 2. Monthly Budgets Overview */}
          <CollapsibleCard
            title="Monthly Budgets"
            action={
              <Link href="/budgets" className="text-xs font-semibold text-accent hover:underline">
                Manage Budgets
              </Link>
            }
          >
            {budgetLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl skeleton" />
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm space-y-2">
                <p>No active monthly budgets set up.</p>
                <Link href="/budgets" className="text-xs font-semibold text-accent hover:underline inline-block">
                  + Create Monthly Budget
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 3).map((b: any) => (
                  <BudgetCard key={b.id} budget={b} />
                ))}
              </div>
            )}
          </CollapsibleCard>
        </div>
      </div>

      <AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />
    </div>
  );
}
