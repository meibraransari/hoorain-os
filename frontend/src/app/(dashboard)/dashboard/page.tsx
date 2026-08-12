'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAccounts, useTransactions, useBudgets } from '@/lib/hooks/useFinance';
import { StatCard } from '@/components/ui/StatCard';
import { AreaChart } from '@/components/charts/AreaChart';
import { PieChart } from '@/components/charts/PieChart';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { BudgetCard } from '@/components/ui/BudgetCard';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { QuickTransferWidget } from '@/components/ui/QuickTransferWidget';
import { CategoryAnalyticsWidget } from '@/components/ui/CategoryAnalyticsWidget';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { RecurringBillsWidget } from '@/components/ui/RecurringBillsWidget';
import { FinancialHealthWidget } from '@/components/ui/FinancialHealthWidget';
import { ExecutiveProfitLossWidget } from '@/components/ui/ExecutiveProfitLossWidget';
import { CreditUtilizationWidget } from '@/components/ui/CreditUtilizationWidget';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LayoutGrid,
  Eye,
  EyeOff,
  Sparkles,
  CreditCard,
  PieChart as PieChartIcon,
  Activity,
  ChevronRight,
  Building2,
  Banknote,
  CalendarClock,
  BrainCircuit,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { useSettings, AppSettings } from '@/components/providers/SettingsProvider';
import Link from 'next/link';

export default function DashboardPage() {
  const { isPrivate, formatPrivateCurrency, formatPrivateNumber } = usePrivacy();
  const { settings, updateSettings } = useSettings();
  const {
    showNetWorth = true,
    showCreditDebt = true,
    showSpendingGraph = true,
    showPieChart = true,
    showObjectives = false,
    showQuickTransfer = true,
    showCategoryAnalytics = true,
    showRecurringBills = true,
    showHealthScore = true,
    showProfitLoss = true,
    showCreditUtilization = true,
    hiddenAccounts = {},
    removeZeroTransactionEntries = false,
  } = settings || {};

  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { transactions: rawTransactions, isLoading: txLoading } = useTransactions({ limit: 2000 });
  const { budgets, isLoading: budgetLoading } = useBudgets();

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'thisMonth' | 'monthlyTrend' | 'customRange'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customPresetKey, setCustomPresetKey] = useState<string>('all');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-close popover when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsAddWidgetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const transactions = useMemo(() => {
    if (!removeZeroTransactionEntries) return rawTransactions;
    return rawTransactions.filter((tx: any) => Math.abs(parseFloat(tx.amount || 0)) > 0);
  }, [rawTransactions, removeZeroTransactionEntries]);

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

  // Timezone-safe local date YYYY-MM helper
  const getLocalDateKey = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Timezone-safe local date YYYY helper
  const getLocalYear = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.getFullYear();
  };

  // Current real calendar month key (e.g. '2026-08')
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Current real calendar year (e.g. 2026)
  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  // THIS MONTH Income
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return false;
        const dKey = getLocalDateKey(tx.date);
        return dKey === currentMonthKey && (tx.type === 'income' || tx.income === 1);
      })
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentMonthKey]);

  // THIS MONTH Expense
  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return false;
        const dKey = getLocalDateKey(tx.date);
        return dKey === currentMonthKey && (tx.type === 'expense' || tx.income === 0);
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentMonthKey]);

  // THIS YEAR Income
  const yearlyIncome = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return false;
        const yr = getLocalYear(tx.date);
        return yr === currentYear && (tx.type === 'income' || tx.income === 1);
      })
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentYear]);

  // THIS YEAR Expense
  const yearlyExpense = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return false;
        const yr = getLocalYear(tx.date);
        return yr === currentYear && (tx.type === 'expense' || tx.income === 0);
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0);
  }, [transactions, currentYear]);

  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)) : 0;

  // Format readable month title (e.g. "August 2026")
  const currentMonthLabel = useMemo(() => {
    const [year, month] = currentMonthKey.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthKey]);

  const handleSelectCustomRange = (start: string, end: string, presetKey: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setCustomPresetKey(presetKey);
    if (start || end || (presetKey && presetKey !== 'all')) {
      setChartTimeframe('customRange');
    } else {
      setChartTimeframe('thisMonth');
    }
  };

  // Compute Cash Flow Chart Data (Formatted for AreaChart with lowercase income & expense keys)
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
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
        const dKey = getLocalDateKey(tx.date);
        if (dKey === currentMonthKey) {
          const day = new Date(tx.date).getDate();
          const amt = Math.abs(parseFloat(tx.amount) || 0);
          if (tx.type === 'income' || tx.income === 1) {
            dailyMap[day].income += amt;
          } else {
            dailyMap[day].expense += amt;
          }
        }
      });

      return Object.entries(dailyMap).map(([day, val]) => ({
        name: `Day ${day}`,
        income: Math.round(val.income),
        expense: Math.round(val.expense),
      }));
    } else if (chartTimeframe === 'monthlyTrend') {
      // 12-Month Trend for current year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yrShort = String(currentYear).slice(-2);

      const monthlyMap: Record<string, { income: number; expense: number }> = {};
      monthNames.forEach((m) => {
        monthlyMap[`${m} ${yrShort}`] = { income: 0, expense: 0 };
      });

      transactions.forEach((tx: any) => {
        if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
        const yr = getLocalYear(tx.date);
        if (yr === currentYear) {
          const d = new Date(tx.date);
          const mName = monthNames[d.getMonth()];
          const key = `${mName} ${yrShort}`;
          const amt = Math.abs(parseFloat(tx.amount) || 0);
          if (tx.type === 'income' || tx.income === 1) {
            if (monthlyMap[key]) monthlyMap[key].income += amt;
          } else {
            if (monthlyMap[key]) monthlyMap[key].expense += amt;
          }
        }
      });

      return Object.entries(monthlyMap).map(([mStr, val]) => ({
        name: mStr,
        income: Math.round(val.income),
        expense: Math.round(val.expense),
      }));
    } else {
      // Custom Range Trend Analysis
      const startMs = customStartDate ? new Date(customStartDate + 'T00:00:00').getTime() : 0;
      const endMs = customEndDate ? new Date(customEndDate + 'T23:59:59').getTime() : Date.now();

      const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 60 && startMs > 0) {
        // Daily intervals for ranges <= 60 days
        const sDate = new Date(customStartDate + 'T00:00:00');
        const eDate = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();

        const dayMap: Record<string, { label: string; income: number; expense: number }> = {};
        for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().substring(0, 10);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dayMap[iso] = { label, income: 0, expense: 0 };
        }

        transactions.forEach((tx: any) => {
          if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
          const tMs = new Date(tx.date).getTime();
          if (tMs >= startMs && tMs <= endMs) {
            const iso = new Date(tx.date).toISOString().substring(0, 10);
            const amt = Math.abs(parseFloat(tx.amount) || 0);
            if (dayMap[iso]) {
              if (tx.type === 'income' || tx.income === 1) dayMap[iso].income += amt;
              else dayMap[iso].expense += amt;
            }
          }
        });

        return Object.values(dayMap).map((v) => ({
          name: v.label,
          income: Math.round(v.income),
          expense: Math.round(v.expense),
        }));
      } else {
        // Monthly intervals for larger custom ranges or All Time
        const monthMap: Record<string, { label: string; income: number; expense: number }> = {};

        transactions.forEach((tx: any) => {
          if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
          const tMs = new Date(tx.date).getTime();
          if ((startMs === 0 || tMs >= startMs) && tMs <= endMs) {
            const d = new Date(tx.date);
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const mLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (!monthMap[mKey]) monthMap[mKey] = { label: mLabel, income: 0, expense: 0 };
            const amt = Math.abs(parseFloat(tx.amount) || 0);
            if (tx.type === 'income' || tx.income === 1) monthMap[mKey].income += amt;
            else monthMap[mKey].expense += amt;
          }
        });

        return Object.entries(monthMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([, v]) => ({
            name: v.label,
            income: Math.round(v.income),
            expense: Math.round(v.expense),
          }));
      }
    }
  }, [transactions, currentMonthKey, currentYear, chartTimeframe, customStartDate, customEndDate]);

  // Compute Top Expenses Category Breakdown Data
  const categoryData = useMemo(() => {
    const currentMonthExpenses = transactions.filter((tx: any) => {
      if (tx.isTransfer || !tx.date) return false;
      const d = new Date(tx.date).toISOString().substring(0, 7);
      return d === currentMonthKey && (tx.type === 'expense' || tx.income === 0);
    });

    const totalExp = currentMonthExpenses.reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0);

    const categoryStats: Record<string, { total: number; count: number }> = {};

    currentMonthExpenses.forEach((tx: any) => {
      const catName = typeof tx.category === 'string' ? tx.category : tx.category?.name || 'General';
      const amt = Math.abs(parseFloat(tx.amount) || 0);

      if (!categoryStats[catName]) {
        categoryStats[catName] = { total: 0, count: 0 };
      }
      categoryStats[catName].total += amt;
      categoryStats[catName].count += 1;
    });

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

  // Persistent Widget toggle helper that closes popover after selection
  const handleToggleWidget = (settingKey: keyof AppSettings, currentVal: boolean) => {
    updateSettings({ [settingKey]: !currentVal });
    setIsAddWidgetOpen(false);
  };

  const handleToggleAccountVisibility = (accId: string) => {
    const currentMap = hiddenAccounts || {};
    const newMap = { ...currentMap, [accId]: !currentMap[accId] };
    updateSettings({ hiddenAccounts: newMap });
    setIsAddWidgetOpen(false);
  };

  const visibleAccounts = useMemo(() => {
    return accounts.filter((acc: any) => !hiddenAccounts[acc.id]);
  }, [accounts, hiddenAccounts]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold text-text-primary">Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20 shadow-sm">
              <Calendar size={12} />
              {currentMonthLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-text-secondary text-sm">Here is your financial performance for {currentMonthLabel}.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* "+ Add Widget" Button & Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsAddWidgetOpen(!isAddWidgetOpen)}
              className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-all shadow-md cursor-pointer group"
            >
              <LayoutGrid size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>+ Add Widget</span>
            </button>

            {/* Popover Dropdown (Auto-closes when clicked anywhere outside or selecting) */}
            {isAddWidgetOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/80 bg-bg-card/95 backdrop-blur-xl p-4 shadow-2xl z-50 animate-fade-in space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent" />
                    Customize Dashboard
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">Click to toggle & close</span>
                </div>

                {/* Dashboard Widgets List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-accent tracking-wider block px-1">Widgets & Charts</span>

                  {[
                    { key: 'showNetWorth', label: 'Net Worth KPI Card', active: showNetWorth, icon: Wallet },
                    { key: 'showProfitLoss', label: 'Executive P&L Summary Widget', active: showProfitLoss, icon: BarChart3 },
                    { key: 'showCreditUtilization', label: 'Credit Utilization & Debt Safety Gauge', active: showCreditUtilization, icon: ShieldAlert },
                    { key: 'showHealthScore', label: 'AI Financial Health Score', active: showHealthScore, icon: BrainCircuit },
                    { key: 'showCreditDebt', label: 'Assets & Debt Breakdown', active: showCreditDebt, icon: Activity },
                    { key: 'showSpendingGraph', label: 'Cash Flow Analysis Chart', active: showSpendingGraph, icon: TrendingUp },
                    { key: 'showPieChart', label: 'Top Expenses Donut Chart', active: showPieChart, icon: PieChartIcon },
                    { key: 'showRecurringBills', label: 'Overdue & Upcoming Bills Widget', active: showRecurringBills, icon: CalendarClock },
                    { key: 'showObjectives', label: 'Financial Objectives Widget', active: showObjectives, icon: Target },
                    { key: 'showQuickTransfer', label: 'Quick Fund Transfer Tool', active: showQuickTransfer, icon: Sparkles },
                    { key: 'showCategoryAnalytics', label: 'Category Expense Progress', active: showCategoryAnalytics, icon: PieChartIcon },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleWidget(item.key as keyof AppSettings, item.active)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-bg-secondary hover:bg-bg-hover hover:border-accent/40 transition-all text-xs font-semibold text-text-primary cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <IconComp size={15} className="text-accent" />
                          <span>{item.label}</span>
                        </div>
                        {item.active ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-income bg-income/10 px-2 py-0.5 rounded-md border border-income/20">
                            <Eye size={12} /> Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted bg-bg-card px-2 py-0.5 rounded-md border border-border">
                            <EyeOff size={12} /> Hidden
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Available Accounts List */}
                {accounts.length > 0 && (
                  <div className="space-y-1.5 pt-2.5 border-t border-border/80">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-wider block px-1">Available Accounts Summary</span>
                    {accounts.map((acc: any) => {
                      const isHidden = hiddenAccounts[acc.id];
                      const bal = typeof acc.currentBalance === 'number' ? acc.currentBalance : parseFloat(acc.currentBalance || acc.balance) || 0;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleToggleAccountVisibility(acc.id)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-bg-secondary hover:bg-bg-hover hover:border-accent/40 transition-all text-xs font-semibold text-text-primary cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <CreditCard size={14} className="text-accent shrink-0" />
                            <span className="truncate">{acc.name}</span>
                          </div>
                          {!isHidden ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-income bg-income/10 px-2 py-0.5 rounded-md border border-income/20 shrink-0">
                              <Eye size={12} /> {formatPrivateCurrency(bal)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted bg-bg-card px-2 py-0.5 rounded-md border border-border shrink-0">
                              <EyeOff size={12} /> Hidden
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAddTxOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Account Quick Summary Widget Bar (If visible accounts exist) */}
      {visibleAccounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <CreditCard size={15} className="text-accent" />
              Accounts ({visibleAccounts.length})
            </span>
            <Link
              href="/accounts"
              className="text-xs font-bold text-accent hover:text-accent-light transition-colors flex items-center gap-1 group"
            >
              <span>Manage Accounts</span>
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar">
            {visibleAccounts.map((acc: any) => {
              const bal = typeof acc.currentBalance === 'number' ? acc.currentBalance : parseFloat(acc.currentBalance || acc.balance) || 0;
              const rawType = (typeof acc.type === 'object' ? acc.type?.name : acc.type || 'Account').toLowerCase();
              const typeLabel = typeof acc.type === 'object' ? acc.type?.name : acc.type || 'Account';
              const color = acc.color || '#6c63ff';

              // Select suitable account icon
              let AccIcon = Building2;
              if (rawType.includes('wallet')) AccIcon = Wallet;
              else if (rawType.includes('cash')) AccIcon = Banknote;
              else if (rawType.includes('credit') || rawType.includes('card')) AccIcon = CreditCard;

              return (
                <Link
                  key={acc.id}
                  href={`/reports?account=${acc.id}`}
                  className="group relative flex flex-col justify-between w-64 min-w-[240px] p-4 rounded-2xl border border-border/80 bg-gradient-to-br from-bg-card/95 via-bg-secondary/70 to-bg-card/95 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-accent/50 hover:-translate-y-1 transition-all duration-300 shrink-0 cursor-pointer overflow-hidden"
                >
                  {/* Top ambient glow blob matching account color */}
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-35"
                    style={{ backgroundColor: color }}
                  />

                  {/* Header: Icon Badge & Account Type Tag */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      <AccIcon size={18} />
                    </div>

                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 group-hover:bg-accent group-hover:text-white transition-colors">
                      {typeLabel}
                    </span>
                  </div>

                  {/* Middle & Bottom: Account Name & Balance */}
                  <div className="mt-4 space-y-1">
                    <span className="text-xs font-bold text-text-primary tracking-tight block truncate group-hover:text-accent transition-colors">
                      {acc.name}
                    </span>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className={`font-mono text-lg sm:text-xl font-extrabold tracking-tight ${
                        bal >= 0 ? 'text-text-primary' : 'text-expense'
                      }`}>
                        {formatPrivateCurrency(bal)}
                      </span>
                      <ChevronRight size={16} className="text-text-muted opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accent" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth Card */}
        {showNetWorth && (
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
              {showCreditDebt && (
                <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-border">
                  <span className="text-income font-medium flex items-center gap-0.5">
                    <ArrowUpRight size={13} /> Assets: {formatPrivateCurrency(totalAssets)}
                  </span>
                  <span className="text-expense font-medium flex items-center gap-0.5">
                    <ArrowDownRight size={13} /> Debt: {formatPrivateCurrency(totalLiabilities)}
                  </span>
                </div>
              )}
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
        )}

        <StatCard
          title={`Income (${currentMonthLabel})`}
          value={formatPrivateCurrency(monthlyIncome)}
          subtitle={`Yearly ${currentYear}: ${formatPrivateCurrency(yearlyIncome)}`}
          icon={<TrendingUp size={20} className="text-income" />}
          trend="This Month"
          trendType="up"
          isLoading={txLoading}
        />
        <StatCard
          title={`Expenses (${currentMonthLabel})`}
          value={formatPrivateCurrency(monthlyExpense)}
          subtitle={`Yearly ${currentYear}: ${formatPrivateCurrency(yearlyExpense)}`}
          icon={<TrendingDown size={20} className="text-expense" />}
          trend="This Month"
          trendType="down"
          isLoading={txLoading}
        />
        <StatCard
          title="Savings Rate"
          value={formatPrivateNumber(savingsRate, '%')}
          subtitle={`Yearly Net: ${formatPrivateCurrency(yearlyIncome - yearlyExpense)}`}
          icon={<Target size={20} className="text-accent" />}
          isLoading={txLoading}
        />
      </div>

      {/* Integrated Masonry Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column (2 Spans): Executive P&L + Credit Utilization + Cash Flow Analysis + Quick Transfer + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive P&L Summary Widget */}
          {showProfitLoss && <ExecutiveProfitLossWidget />}

          {/* Credit Utilization & Debt Safety Gauge Widget */}
          {showCreditUtilization && <CreditUtilizationWidget />}

          {/* 1. Cash Flow Analysis Chart */}
          {showSpendingGraph && (
            <AreaChart
              data={chartData}
              title={
                chartTimeframe === 'thisMonth'
                  ? `Daily Cash Flow (${currentMonthLabel})`
                  : chartTimeframe === 'monthlyTrend'
                  ? `12-Month Cash Flow Trend (${currentYear})`
                  : `Cash Flow Trend (${customStartDate && customEndDate ? `${customStartDate} → ${customEndDate}` : 'Custom Range'})`
              }
              height={320}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-bg-card p-1 rounded-xl border border-border shadow-sm">
                    <button
                      onClick={() => setChartTimeframe('thisMonth')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        chartTimeframe === 'thisMonth'
                          ? 'bg-accent text-white shadow-sm font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      This Month (Daily)
                    </button>
                    <button
                      onClick={() => setChartTimeframe('monthlyTrend')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        chartTimeframe === 'monthlyTrend'
                          ? 'bg-accent text-white shadow-sm font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      12-Month Trend
                    </button>
                  </div>

                  <DateRangePicker
                    startDate={customStartDate}
                    endDate={customEndDate}
                    datePreset={customPresetKey}
                    onSelectRange={handleSelectCustomRange}
                  />
                </div>
              }
            />
          )}

          {/* 2. Quick Transfer Tool (Persistently toggled) */}
          {showQuickTransfer && <QuickTransferWidget />}

          {/* 3. Recent Transactions */}
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
              <div className="p-8 text-center text-text-muted text-sm">
                No transactions recorded yet. Click "Add Transaction" or import your database backup.
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

        {/* Right Column (1 Span): AI Health + Top Expenses + Category Analytics + Monthly Budgets + Recurring Bills */}
        <div className="space-y-6">
          {/* 1. AI Financial Health Score Widget */}
          {showHealthScore && <FinancialHealthWidget />}

          {/* 2. Overdue & Upcoming Bills Widget */}
          {showRecurringBills && <RecurringBillsWidget />}

          {/* 2. Top Expenses Donut Widget */}
          {showPieChart && <PieChart data={categoryData} title={`Top Expenses (${currentMonthLabel})`} />}

          {/* 2. Category Expense Analytics Bar (Persistently toggled) */}
          {showCategoryAnalytics && <CategoryAnalyticsWidget />}

          {/* 3. Monthly Budgets Overview */}
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

          {/* 4. Financial Objectives Widget */}
          {showObjectives && (
            <CollapsibleCard
              title="Financial Goals & Objectives"
              action={
                <Link href="/goals" className="text-xs font-semibold text-accent hover:underline">
                  Manage Goals
                </Link>
              }
            >
              <div className="p-4 text-center text-text-muted text-sm space-y-2">
                <p>Financial Objectives widget is active.</p>
                <Link href="/goals" className="text-xs font-semibold text-accent hover:underline inline-block">
                  + View Financial Goals
                </Link>
              </div>
            </CollapsibleCard>
          )}
        </div>
      </div>

      <AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />
    </div>
  );
}
