'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { useTransactions, useAccounts, useCategories } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { SmoothSelect, SelectOption } from '@/components/ui/SmoothSelect';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { api } from '@/lib/api';
import {
  BarChart3,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Building2,
  Tag,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Filter,
  Award,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Eye,
  ListFilter,
  Check,
  Sparkles,
} from 'lucide-react';

function ItemizedTransactionSubTable({ transactions }: { transactions: any[] }) {
  const { formatPrivateCurrency } = usePrivacy();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-3 text-xs text-text-muted italic bg-bg-card/70 rounded-lg border border-border mt-3">
        No individual transaction records found for this section.
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg animate-fade-in">
      <div className="px-4 py-2.5 bg-bg-hover/80 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <ListFilter size={14} className="text-accent" />
          <span>Itemized Transactions ({transactions.length})</span>
        </span>
        <span className="text-[11px] text-text-muted font-medium">Privacy Masked</span>
      </div>
      <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
        {transactions.map((tx: any, idx: number) => {
          const rawAmt = Math.abs(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0);
          const isTransfer = tx.isTransfer || tx.type === 'transfer';
          const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);
          const amtColor = isTransfer ? 'text-accent' : isIncome ? 'text-income' : 'text-expense';
          
          let formattedDate = 'No Date';
          if (tx.date) {
            try {
              formattedDate = format(new Date(tx.date), 'MMM d, yyyy');
            } catch (e) {}
          }

          const title = tx.title || tx.name || tx.notes || 'Transaction';
          const catName = typeof tx.category === 'object' ? tx.category?.name : tx.category || 'General';
          const accName = typeof tx.account === 'object' ? tx.account?.name : tx.account || 'Account';

          return (
            <div key={tx.id || idx} className="p-3 hover:bg-bg-hover/60 flex items-center justify-between text-xs transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-text-muted font-mono text-[11px] w-24 shrink-0">{formattedDate}</span>
                <div>
                  <div className="font-semibold text-text-primary">{title}</div>
                  <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-bg-hover border border-border">{catName}</span>
                    <span>•</span>
                    <span>{accName}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-bold ${amtColor}`}>{formatPrivateCurrency(rawAmt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsContent() {
  const { formatPrivateCurrency } = usePrivacy();
  const searchParams = useSearchParams();
  const initialAccountParam = searchParams.get('account') || searchParams.get('accountId') || '';
  const initialCategoryParam = searchParams.get('category') || searchParams.get('categoryId') || '';

  const [activeTab, setActiveTab] = useState<'account' | 'category' | 'type' | 'timeline' | 'merchants'>('account');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Pending Filter States (User selections before clicking Apply Filter)
  const [pendingTimeRange, setPendingTimeRange] = useState<string>('all');
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [pendingAccountFilter, setPendingAccountFilter] = useState(initialAccountParam);
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState(initialCategoryParam);
  const [pendingTypeFilter, setPendingTypeFilter] = useState('');
  const [pendingMinAmount, setPendingMinAmount] = useState('');
  const [pendingMaxAmount, setPendingMaxAmount] = useState('');
  const [pendingSearchKeyword, setPendingSearchKeyword] = useState('');

  // Applied Filter States (Committed states used to filter data after clicking Apply Filter)
  const [appliedTimeRange, setAppliedTimeRange] = useState<string>('all');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedAccountFilter, setAppliedAccountFilter] = useState(initialAccountParam);
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState(initialCategoryParam);
  const [appliedTypeFilter, setAppliedTypeFilter] = useState('');
  const [appliedMinAmount, setAppliedMinAmount] = useState('');
  const [appliedMaxAmount, setAppliedMaxAmount] = useState('');
  const [appliedSearchKeyword, setAppliedSearchKeyword] = useState('');

  // Expandable transaction sections tracking
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (initialAccountParam) {
      setPendingAccountFilter(initialAccountParam);
      setAppliedAccountFilter(initialAccountParam);
      setActiveTab('account');
      setIsFilterOpen(true);
    } else if (initialCategoryParam) {
      setPendingCategoryFilter(initialCategoryParam);
      setAppliedCategoryFilter(initialCategoryParam);
      setActiveTab('category');
      setIsFilterOpen(true);
    }
  }, [initialAccountParam, initialCategoryParam]);

  const { transactions } = useTransactions({ limit: 1000 });
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  // Commit pending filters to applied state
  const handleApplyFilters = () => {
    setAppliedTimeRange(pendingTimeRange);
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
    setAppliedAccountFilter(pendingAccountFilter);
    setAppliedCategoryFilter(pendingCategoryFilter);
    setAppliedTypeFilter(pendingTypeFilter);
    setAppliedMinAmount(pendingMinAmount);
    setAppliedMaxAmount(pendingMaxAmount);
    setAppliedSearchKeyword(pendingSearchKeyword);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setPendingTimeRange('all');
    setPendingStartDate('');
    setPendingEndDate('');
    setPendingAccountFilter('');
    setPendingCategoryFilter('');
    setPendingTypeFilter('');
    setPendingMinAmount('');
    setPendingMaxAmount('');
    setPendingSearchKeyword('');

    setAppliedTimeRange('all');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedAccountFilter('');
    setAppliedCategoryFilter('');
    setAppliedTypeFilter('');
    setAppliedMinAmount('');
    setAppliedMaxAmount('');
    setAppliedSearchKeyword('');
  };

  // Check if pending filters differ from applied filters
  const isDirty = useMemo(() => {
    return (
      pendingTimeRange !== appliedTimeRange ||
      pendingStartDate !== appliedStartDate ||
      pendingEndDate !== appliedEndDate ||
      pendingAccountFilter !== appliedAccountFilter ||
      pendingCategoryFilter !== appliedCategoryFilter ||
      pendingTypeFilter !== appliedTypeFilter ||
      pendingMinAmount !== appliedMinAmount ||
      pendingMaxAmount !== appliedMaxAmount ||
      pendingSearchKeyword !== appliedSearchKeyword
    );
  }, [
    pendingTimeRange,
    appliedTimeRange,
    pendingStartDate,
    appliedStartDate,
    pendingEndDate,
    appliedEndDate,
    pendingAccountFilter,
    appliedAccountFilter,
    pendingCategoryFilter,
    appliedCategoryFilter,
    pendingTypeFilter,
    appliedTypeFilter,
    pendingMinAmount,
    appliedMinAmount,
    pendingMaxAmount,
    appliedMaxAmount,
    pendingSearchKeyword,
    appliedSearchKeyword,
  ]);

  // Count active applied filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedTimeRange !== 'all') count++;
    if (appliedStartDate) count++;
    if (appliedEndDate) count++;
    if (appliedAccountFilter) count++;
    if (appliedCategoryFilter) count++;
    if (appliedTypeFilter) count++;
    if (appliedMinAmount) count++;
    if (appliedMaxAmount) count++;
    if (appliedSearchKeyword) count++;
    return count;
  }, [
    appliedTimeRange,
    appliedStartDate,
    appliedEndDate,
    appliedAccountFilter,
    appliedCategoryFilter,
    appliedTypeFilter,
    appliedMinAmount,
    appliedMaxAmount,
    appliedSearchKeyword,
  ]);

  // Filter transactions based on APPLIED options
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    const now = new Date();

    return transactions.filter((tx: any) => {
      const rawAmt = Math.abs(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0);
      const isTransfer = tx.isTransfer || tx.type === 'type' || tx.type === 'transfer';
      const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);
      const txType = isTransfer ? 'transfer' : isIncome ? 'income' : 'expense';

      // 1. Type Filter
      if (appliedTypeFilter && txType !== appliedTypeFilter) return false;

      // 2. Account Filter
      if (appliedAccountFilter) {
        const accId = tx.accountId || (typeof tx.account === 'object' ? tx.account?.id : '');
        const accName = typeof tx.account === 'string' ? tx.account : tx.account?.name || '';
        if (accId !== appliedAccountFilter && accName !== appliedAccountFilter) return false;
      }

      // 3. Category Filter
      if (appliedCategoryFilter) {
        const catId = tx.categoryId || (typeof tx.category === 'object' ? tx.category?.id : '');
        const catName = typeof tx.category === 'string' ? tx.category : tx.category?.name || '';
        if (catId !== appliedCategoryFilter && catName !== appliedCategoryFilter) return false;
      }

      // 4. Amount Range
      if (appliedMinAmount && rawAmt < parseFloat(appliedMinAmount)) return false;
      if (appliedMaxAmount && rawAmt > parseFloat(appliedMaxAmount)) return false;

      // 5. Search Keyword Filter
      if (appliedSearchKeyword) {
        const query = appliedSearchKeyword.toLowerCase();
        const title = (tx.title || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const name = (tx.name || '').toLowerCase();
        if (!title.includes(query) && !notes.includes(query) && !name.includes(query)) return false;
      }

      // 6. Date Range & Presets
      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!isNaN(txDate.getTime())) {
          if (appliedTimeRange === 'this_week' || appliedTimeRange === 'thisWeek') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            if (txDate < weekAgo) return false;
          } else if (appliedTimeRange === 'last_week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(now.getDate() - 14);
            if (txDate < twoWeeksAgo || txDate > weekAgo) return false;
          } else if (appliedTimeRange === 'this_month' || appliedTimeRange === 'thisMonth') {
            if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
          } else if (appliedTimeRange === 'last_month') {
            const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            if (txDate.getMonth() !== lm.getMonth() || txDate.getFullYear() !== lm.getFullYear()) return false;
          } else if (appliedTimeRange === 'this_year' || appliedTimeRange === 'thisYear') {
            if (txDate.getFullYear() !== now.getFullYear()) return false;
          } else if (appliedTimeRange === 'custom' || appliedStartDate || appliedEndDate) {
            if (appliedStartDate) {
              const start = new Date(appliedStartDate);
              if (!isNaN(start.getTime()) && txDate < start) return false;
            }
            if (appliedEndDate) {
              const end = new Date(appliedEndDate);
              end.setHours(23, 59, 59, 999);
              if (!isNaN(end.getTime()) && txDate > end) return false;
            }
          }
        }
      }

      return true;
    });
  }, [
    transactions,
    appliedTypeFilter,
    appliedAccountFilter,
    appliedCategoryFilter,
    appliedMinAmount,
    appliedMaxAmount,
    appliedSearchKeyword,
    appliedTimeRange,
    appliedStartDate,
    appliedEndDate,
  ]);

  // Derived expense & financial stats
  const {
    totalExpenses,
    totalIncome,
    totalTransfers,
    expenseTxs,
    incomeTxs,
    transferTxs,
    avgExpense,
    accountBreakdown,
    categoryBreakdown,
    merchantBreakdown,
    monthlyBreakdown,
    spendingBrackets,
  } = useMemo(() => {
    let expSum = 0;
    let incSum = 0;
    let trfSum = 0;

    const expList: any[] = [];
    const incList: any[] = [];
    const trfList: any[] = [];

    const accMap: Record<string, { id: string; name: string; amount: number; count: number; color: string; txs: any[] }> = {};
    const catMap: Record<string, { id: string; name: string; amount: number; count: number; color: string; txs: any[] }> = {};
    const merchMap: Record<string, { name: string; amount: number; count: number; txs: any[] }> = {};
    const monthMap: Record<string, { monthName: string; expense: number; income: number; count: number; txs: any[] }> = {};

    const brackets: Record<string, { label: string; count: number; total: number; color: string; txs: any[] }> = {
      micro: { label: '< ₹500 (Micro)', count: 0, total: 0, color: '#00bcd4', txs: [] },
      regular: { label: '₹500 - ₹2,000 (Regular)', count: 0, total: 0, color: '#3f51b5', txs: [] },
      major: { label: '₹2,000 - ₹10,000 (Major)', count: 0, total: 0, color: '#ff9800', txs: [] },
      high: { label: '> ₹10,000 (High Value)', count: 0, total: 0, color: '#ff4d6d', txs: [] },
    };

    filteredTransactions.forEach((tx: any) => {
      const amount = Math.abs(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0);
      const isTransfer = tx.isTransfer || tx.type === 'transfer';
      const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);

      const accId = tx.accountId || (typeof tx.account === 'object' ? tx.account?.id : '');
      const accName = typeof tx.account === 'string' ? tx.account : tx.account?.name || 'Unassigned Account';
      const catId = tx.categoryId || (typeof tx.category === 'object' ? tx.category?.id : '');
      const catName = typeof tx.category === 'string' ? tx.category : tx.category?.name || (isTransfer ? 'Transfer' : 'General Expense');
      const merchName = tx.title || tx.notes || tx.name || catName || 'Other Merchant';

      // Monthly key (YYYY-MM)
      let mKey = 'Recent';
      if (tx.date) {
        try {
          const d = new Date(tx.date);
          if (!isNaN(d.getTime())) {
            mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          }
        } catch (e) {}
      }

      if (!monthMap[mKey]) {
        monthMap[mKey] = { monthName: mKey, expense: 0, income: 0, count: 0, txs: [] };
      }
      monthMap[mKey].count += 1;
      monthMap[mKey].txs.push(tx);

      if (isTransfer) {
        trfSum += amount;
        trfList.push(tx);
      } else if (isIncome) {
        incSum += amount;
        incList.push(tx);
        monthMap[mKey].income += amount;
      } else {
        expSum += amount;
        expList.push(tx);
        monthMap[mKey].expense += amount;

        // Account map
        const accKey = accId || accName;
        if (!accMap[accKey]) {
          const accObj = accounts.find((a: any) => a.name === accName || a.id === accId);
          accMap[accKey] = { id: accId, name: accName, amount: 0, count: 0, color: accObj?.color || '#6c63ff', txs: [] };
        }
        accMap[accKey].amount += amount;
        accMap[accKey].count += 1;
        accMap[accKey].txs.push(tx);

        // Category map
        const catKey = catId || catName;
        if (!catMap[catKey]) {
          const catObj = categories.find((c: any) => c.name === catName || c.id === catId);
          catMap[catKey] = { id: catId, name: catName, amount: 0, count: 0, color: catObj?.color || '#ff4d6d', txs: [] };
        }
        catMap[catKey].amount += amount;
        catMap[catKey].count += 1;
        catMap[catKey].txs.push(tx);

        // Merchant map
        if (!merchMap[merchName]) {
          merchMap[merchName] = { name: merchName, amount: 0, count: 0, txs: [] };
        }
        merchMap[merchName].amount += amount;
        merchMap[merchName].count += 1;
        merchMap[merchName].txs.push(tx);

        // Spending brackets
        if (amount < 500) {
          brackets.micro.count += 1;
          brackets.micro.total += amount;
          brackets.micro.txs.push(tx);
        } else if (amount <= 2000) {
          brackets.regular.count += 1;
          brackets.regular.total += amount;
          brackets.regular.txs.push(tx);
        } else if (amount <= 10000) {
          brackets.major.count += 1;
          brackets.major.total += amount;
          brackets.major.txs.push(tx);
        } else {
          brackets.high.count += 1;
          brackets.high.total += amount;
          brackets.high.txs.push(tx);
        }
      }
    });

    const avgExp = expList.length > 0 ? expSum / expList.length : 0;
    const accList = Object.values(accMap).sort((a, b) => b.amount - a.amount);
    const catList = Object.values(catMap).sort((a, b) => b.amount - a.amount);
    const merchList = Object.values(merchMap).sort((a, b) => b.amount - a.amount).slice(0, 10);
    const monthList = Object.values(monthMap);

    return {
      totalExpenses: expSum,
      totalIncome: incSum,
      totalTransfers: trfSum,
      expenseTxs: expList,
      incomeTxs: incList,
      transferTxs: trfList,
      avgExpense: avgExp,
      accountBreakdown: accList,
      categoryBreakdown: catList,
      merchantBreakdown: merchList,
      monthlyBreakdown: monthList,
      spendingBrackets: Object.values(brackets),
    };
  }, [filteredTransactions, accounts, categories]);

  // Options for SmoothSelect dropdowns
  const accountOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'All Accounts' },
      ...accounts.map((acc: any) => ({
        value: acc.id,
        label: acc.name,
        color: acc.color || '#6c63ff',
      })),
    ];
  }, [accounts]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'All Categories' },
      ...categories.map((cat: any) => ({
        value: cat.id,
        label: cat.name,
        color: cat.color || '#ff4d6d',
      })),
    ];
  }, [categories]);

  const typeOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'All Types (Expenses, Income, Transfers)' },
      { value: 'expense', label: 'Expenses Only' },
      { value: 'income', label: 'Income Only' },
      { value: 'transfer', label: 'Transfers Only' },
    ];
  }, []);

  const handleExportCsv = async () => {
    try {
      const response: any = await api.get('/export/transactions?format=csv', { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `filtered-expense-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to export CSV report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportsList = [
    { id: 'account', label: '1. Expenses by Account', icon: Building2, desc: 'Spending breakdown across bank, cash, and card accounts' },
    { id: 'category', label: '2. Expenses by Category', icon: Tag, desc: 'Category distribution & itemized spending breakdown' },
    { id: 'type', label: '3. Transaction Type & Flow', icon: ArrowRightLeft, desc: 'Expense vs Income vs Transfers ratio & savings velocity' },
    { id: 'timeline', label: '4. Spending Velocity & Trend', icon: BarChart3, desc: 'Monthly trends and daily expense velocity' },
    { id: 'merchants', label: '5. Top Payees & Brackets', icon: Award, desc: 'Top vendors and transaction size bracket distribution' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Financial Analytics & Custom Reports</h1>
          <p className="text-text-secondary mt-1">Multi-dimensional custom filtering with itemized expandable transactions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} className="text-accent" />
            <span>Custom Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-accent text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-accent-light transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Advanced Custom Filter Control Panel with Luxury DateRangePicker & Apply Button */}
      {isFilterOpen && (
        <div className="card p-6 border border-accent/30 bg-bg-card rounded-2xl space-y-5 shadow-2xl animate-fade-in relative overflow-hidden">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <Filter size={18} className="text-accent" />
              <span className="font-extrabold text-text-primary text-base tracking-tight">
                Multi-Dimensional Custom Report Filters
              </span>
              {isDirty && (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 rounded-full border border-amber-500/30">
                  Unapplied Changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-expense hover:underline cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset All ({activeFiltersCount})</span>
                </button>
              )}

              {/* Main Prominent Apply Filter Button */}
              <button
                onClick={handleApplyFilters}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                  isDirty
                    ? 'bg-[#6c63ff] text-white shadow-[#6c63ff]/40 hover:bg-[#8b85ff] scale-[1.03] ring-2 ring-[#6c63ff]/50'
                    : 'bg-accent/20 text-accent border border-accent/40 hover:bg-accent hover:text-white'
                }`}
              >
                <Check size={16} />
                <span>Apply Filter</span>
              </button>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Premium Calendar DateRangePicker */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                Calendar & Date Filter
              </label>
              <DateRangePicker
                startDate={pendingStartDate}
                endDate={pendingEndDate}
                datePreset={pendingTimeRange}
                onSelectRange={(start, end, preset) => {
                  setPendingStartDate(start);
                  setPendingEndDate(end);
                  setPendingTimeRange(preset);
                }}
              />
            </div>

            {/* 2. Account Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                Account Filter
              </label>
              <SmoothSelect
                value={pendingAccountFilter}
                onChange={(val) => setPendingAccountFilter(val)}
                options={accountOptions}
                placeholder="All Accounts"
              />
            </div>

            {/* 3. Category Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                Category Filter
              </label>
              <SmoothSelect
                value={pendingCategoryFilter}
                onChange={(val) => setPendingCategoryFilter(val)}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            {/* 4. Transaction Type Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                Transaction Type
              </label>
              <SmoothSelect
                value={pendingTypeFilter}
                onChange={(val) => setPendingTypeFilter(val)}
                options={typeOptions}
                placeholder="All Types"
              />
            </div>
          </div>

          {/* Amount Filters & Keyword Search Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border/80">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Min Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={pendingMinAmount}
                onChange={(e) => setPendingMinAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-hover px-3.5 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Max Amount (₹)
              </label>
              <input
                type="number"
                placeholder="No Limit"
                value={pendingMaxAmount}
                onChange={(e) => setPendingMaxAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-hover px-3.5 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none transition-all"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Vendor / Notes Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter by vendor, item name or notes..."
                  value={pendingSearchKeyword}
                  onChange={(e) => setPendingSearchKeyword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-hover pl-10 pr-3.5 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="text-xs text-text-muted font-medium flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span>Select calendar range or criteria, then click <strong>Apply Filter</strong>.</span>
            </div>

            <button
              onClick={handleApplyFilters}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                isDirty
                  ? 'bg-[#6c63ff] text-white shadow-[#6c63ff]/40 hover:bg-[#8b85ff] scale-[1.02] ring-2 ring-[#6c63ff]/50'
                  : 'bg-accent/20 text-accent border border-accent/40 hover:bg-accent hover:text-white'
              }`}
            >
              <Check size={16} />
              <span>Apply Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 border border-expense/30 bg-expense/5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-expense font-bold uppercase">
            <span>Filtered Expenses</span>
            <TrendingDown size={18} />
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">
            {formatPrivateCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-text-muted">{expenseTxs.length} expense transactions</p>
        </div>

        <div className="card p-5 border border-income/30 bg-income/5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-income font-bold uppercase">
            <span>Filtered Income</span>
            <TrendingUp size={18} />
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">
            {formatPrivateCurrency(totalIncome)}
          </div>
          <p className="text-xs text-text-muted">{incomeTxs.length} income transactions</p>
        </div>

        <div className="card p-5 border border-accent/30 bg-accent/5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-accent font-bold uppercase">
            <span>Filtered Transfers</span>
            <ArrowRightLeft size={18} />
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">
            {formatPrivateCurrency(totalTransfers)}
          </div>
          <p className="text-xs text-text-muted">{transferTxs.length} internal transfer transactions</p>
        </div>

        <div className="card p-5 border border-border bg-bg-card rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase">
            <span>Avg Expense Size</span>
            <Award size={18} className="text-accent" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">
            {formatPrivateCurrency(avgExpense)}
          </div>
          <p className="text-xs text-text-muted">Average per expense ticket</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Reports Views */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
        {reportsList.map((r) => {
          const IconComponent = r.icon;
          const isActive = activeTab === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setActiveTab(r.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-[1.02]'
                  : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <IconComponent size={15} />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Expenses by Account */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-text-primary">1. Expense Breakdown by Account</h3>
            <span className="text-xs text-text-muted">{accountBreakdown.length} Accounts Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountBreakdown.map((acc) => {
              const pct = totalExpenses > 0 ? ((acc.amount / totalExpenses) * 100).toFixed(1) : '0';
              const isExpanded = !!expandedItems[`acc-${acc.name}`];

              return (
                <div key={acc.name} className="card p-5 border border-border bg-bg-card rounded-xl space-y-3 shadow-md hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                      <span className="font-bold text-text-primary text-sm">{acc.name}</span>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                      {pct}% of Total
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-expense">{formatPrivateCurrency(acc.amount)}</div>
                    <div className="text-xs text-text-muted mt-0.5">{acc.count} expense transactions logged</div>
                  </div>

                  <div className="w-full bg-bg-hover h-2 rounded-full overflow-hidden border border-border">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: acc.color }} />
                  </div>

                  <button
                    onClick={() => toggleExpand(`acc-${acc.name}`)}
                    className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Itemized Records' : `View Itemized Records (${acc.txs.length})`}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && <ItemizedTransactionSubTable transactions={acc.txs} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Expenses by Category */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-text-primary">2. Expense Breakdown by Category</h3>
            <span className="text-xs text-text-muted">{categoryBreakdown.length} Categories Tracked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBreakdown.map((cat) => {
              const pct = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : '0';
              const isExpanded = !!expandedItems[`cat-${cat.name}`];

              return (
                <div key={cat.name} className="card p-5 border border-border bg-bg-card rounded-xl space-y-3 shadow-md hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-text-primary text-sm">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-expense bg-expense/10 px-2 py-0.5 rounded-md border border-expense/20">
                      {pct}% of Total
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-expense">{formatPrivateCurrency(cat.amount)}</div>
                    <div className="text-xs text-text-muted mt-0.5">{cat.count} expense transactions logged</div>
                  </div>

                  <div className="w-full bg-bg-hover h-2 rounded-full overflow-hidden border border-border">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>

                  <button
                    onClick={() => toggleExpand(`cat-${cat.name}`)}
                    className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Itemized Records' : `View Itemized Records (${cat.txs.length})`}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && <ItemizedTransactionSubTable transactions={cat.txs} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Transaction Type & Cash Flow */}
      {activeTab === 'type' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-text-primary">3. Financial Flow Ratio Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border border-expense/30 bg-bg-card rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-sm">Expenses Outflow</span>
                <span className="text-xs font-bold text-expense bg-expense/15 px-2 py-0.5 rounded-md">
                  {((totalExpenses / Math.max(1, totalExpenses + totalIncome)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-expense">{formatPrivateCurrency(totalExpenses)}</div>
              <div className="text-xs text-text-muted">{expenseTxs.length} total expense entries</div>
              <button
                onClick={() => toggleExpand('flow-exp')}
                className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <span>Itemized Records</span>
                {expandedItems['flow-exp'] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedItems['flow-exp'] && <ItemizedTransactionSubTable transactions={expenseTxs} />}
            </div>

            <div className="card p-5 border border-income/30 bg-bg-card rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-sm">Income Inflow</span>
                <span className="text-xs font-bold text-income bg-income/15 px-2 py-0.5 rounded-md">
                  {((totalIncome / Math.max(1, totalExpenses + totalIncome)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-income">{formatPrivateCurrency(totalIncome)}</div>
              <div className="text-xs text-text-muted">{incomeTxs.length} total income entries</div>
              <button
                onClick={() => toggleExpand('flow-inc')}
                className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <span>Itemized Records</span>
                {expandedItems['flow-inc'] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedItems['flow-inc'] && <ItemizedTransactionSubTable transactions={incomeTxs} />}
            </div>

            <div className="card p-5 border border-accent/30 bg-bg-card rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-sm">Internal Transfers</span>
                <span className="text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-md">Internal</span>
              </div>
              <div className="text-2xl font-bold text-accent">{formatPrivateCurrency(totalTransfers)}</div>
              <div className="text-xs text-text-muted">{transferTxs.length} internal transfer pairs</div>
              <button
                onClick={() => toggleExpand('flow-trf')}
                className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <span>Itemized Records</span>
                {expandedItems['flow-trf'] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedItems['flow-trf'] && <ItemizedTransactionSubTable transactions={transferTxs} />}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Spending Velocity & Monthly Trend */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-text-primary">4. Monthly Spending Velocity</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthlyBreakdown.map((m) => {
              const isExpanded = !!expandedItems[`month-${m.monthName}`];
              return (
                <div key={m.monthName} className="card p-5 border border-border bg-bg-card rounded-xl space-y-3 shadow-md hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-base">{m.monthName}</span>
                    <span className="text-xs font-bold text-text-muted bg-bg-hover px-2.5 py-0.5 rounded-md border border-border">
                      {m.count} transactions
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-expense/10 border border-expense/20">
                      <span className="text-text-muted block uppercase text-[10px] font-bold">Expenses</span>
                      <span className="font-extrabold text-expense text-sm">{formatPrivateCurrency(m.expense)}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-income/10 border border-income/20">
                      <span className="text-text-muted block uppercase text-[10px] font-bold">Income</span>
                      <span className="font-extrabold text-income text-sm">{formatPrivateCurrency(m.income)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(`month-${m.monthName}`)}
                    className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Monthly Records' : `View Itemized Records (${m.txs.length})`}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && <ItemizedTransactionSubTable transactions={m.txs} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Top Payees & Transaction Brackets */}
      {activeTab === 'merchants' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-text-primary">Top 10 Payees & Vendors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {merchantBreakdown.map((m) => {
                const isExpanded = !!expandedItems[`merch-${m.name}`];
                return (
                  <div key={m.name} className="card p-4 border border-border bg-bg-card rounded-xl space-y-2 hover:border-accent/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary text-sm">{m.name}</span>
                      <span className="text-xs font-bold text-expense">{formatPrivateCurrency(m.amount)}</span>
                    </div>
                    <div className="text-xs text-text-muted">{m.count} transactions logged</div>
                    <button
                      onClick={() => toggleExpand(`merch-${m.name}`)}
                      className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      <span>Itemized Records</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && <ItemizedTransactionSubTable transactions={m.txs} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-text-primary">Transaction Size Bracket Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {spendingBrackets.map((b) => {
                const isExpanded = !!expandedItems[`bkt-${b.label}`];
                return (
                  <div key={b.label} className="card p-5 border border-border bg-bg-card rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary uppercase" style={{ color: b.color }}>{b.label}</span>
                      <span className="text-xs text-text-muted font-bold">{b.count} txs</span>
                    </div>
                    <div className="text-xl font-extrabold text-text-primary">{formatPrivateCurrency(b.total)}</div>
                    <button
                      onClick={() => toggleExpand(`bkt-${b.label}`)}
                      className="w-full flex items-center justify-between pt-2 border-t border-border text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      <span>Itemized Records</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && <ItemizedTransactionSubTable transactions={b.txs} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl skeleton" />}>
      <ReportsContent />
    </Suspense>
  );
}
