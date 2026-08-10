'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { useTransactions, useAccounts, useCategories } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { SmoothSelect, SelectOption } from '@/components/ui/SmoothSelect';
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

  const [activeTab, setActiveTab] = useState<'account' | 'category' | 'type' | 'timeline' | 'merchants'>('account');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Filter States
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | '30days' | '90days' | 'thisYear' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountFilter, setAccountFilter] = useState(initialAccountParam);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Expandable transaction sections tracking
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (initialAccountParam) {
      setAccountFilter(initialAccountParam);
      setIsFilterOpen(true);
    }
  }, [initialAccountParam]);

  const { transactions } = useTransactions({ limit: 1000 });
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  // Reset all custom filters
  const handleResetFilters = () => {
    setTimeRange('all');
    setStartDate('');
    setEndDate('');
    setAccountFilter('');
    setCategoryFilter('');
    setTypeFilter('');
    setMinAmount('');
    setMaxAmount('');
    setSearchKeyword('');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (timeRange !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (accountFilter) count++;
    if (categoryFilter) count++;
    if (typeFilter) count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    if (searchKeyword) count++;
    return count;
  }, [timeRange, startDate, endDate, accountFilter, categoryFilter, typeFilter, minAmount, maxAmount, searchKeyword]);

  // Filter transactions based on all custom multi-dimensional options
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    const now = new Date();

    return transactions.filter((tx: any) => {
      const rawAmt = Math.abs(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0);
      const isTransfer = tx.isTransfer || tx.type === 'transfer';
      const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);
      const isExpense = !isTransfer && !isIncome;

      const txType = isTransfer ? 'transfer' : isIncome ? 'income' : 'expense';

      // 1. Type Filter
      if (typeFilter && txType !== typeFilter) return false;

      // 2. Account Filter
      if (accountFilter) {
        const accId = tx.accountId || (typeof tx.account === 'object' ? tx.account?.id : '');
        const accName = typeof tx.account === 'string' ? tx.account : tx.account?.name || '';
        if (accId !== accountFilter && accName !== accountFilter) return false;
      }

      // 3. Category Filter
      if (categoryFilter) {
        const catId = tx.categoryId || (typeof tx.category === 'object' ? tx.category?.id : '');
        const catName = typeof tx.category === 'string' ? tx.category : tx.category?.name || '';
        if (catId !== categoryFilter && catName !== categoryFilter) return false;
      }

      // 4. Amount Range
      if (minAmount && rawAmt < parseFloat(minAmount)) return false;
      if (maxAmount && rawAmt > parseFloat(maxAmount)) return false;

      // 5. Search Keyword Filter
      if (searchKeyword) {
        const query = searchKeyword.toLowerCase();
        const title = (tx.title || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const name = (tx.name || '').toLowerCase();
        if (!title.includes(query) && !notes.includes(query) && !name.includes(query)) return false;
      }

      // 6. Date Range & Presets
      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!isNaN(txDate.getTime())) {
          if (timeRange === 'today') {
            if (txDate.toDateString() !== now.toDateString()) return false;
          } else if (timeRange === 'thisWeek') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            if (txDate < weekAgo) return false;
          } else if (timeRange === '30days') {
            const past30 = new Date();
            past30.setDate(now.getDate() - 30);
            if (txDate < past30) return false;
          } else if (timeRange === '90days') {
            const past90 = new Date();
            past90.setDate(now.getDate() - 90);
            if (txDate < past90) return false;
          } else if (timeRange === 'thisMonth') {
            if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
          } else if (timeRange === 'thisYear') {
            if (txDate.getFullYear() !== now.getFullYear()) return false;
          } else if (timeRange === 'custom') {
            if (startDate) {
              const start = new Date(startDate);
              if (!isNaN(start.getTime()) && txDate < start) return false;
            }
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (!isNaN(end.getTime()) && txDate > end) return false;
            }
          }
        }
      }

      return true;
    });
  }, [transactions, typeFilter, accountFilter, categoryFilter, minAmount, maxAmount, searchKeyword, timeRange, startDate, endDate]);

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
      const isExpense = !isTransfer && !isIncome;

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

    const accArray = Object.values(accMap).sort((a, b) => b.amount - a.amount);
    const catArray = Object.values(catMap).sort((a, b) => b.amount - a.amount);
    const merchArray = Object.values(merchMap).sort((a, b) => b.amount - a.amount).slice(0, 10);
    const monthArray = Object.values(monthMap);

    return {
      totalExpenses: expSum,
      totalIncome: incSum,
      totalTransfers: trfSum,
      expenseTxs: expList,
      incomeTxs: incList,
      transferTxs: trfList,
      avgExpense: expList.length > 0 ? expSum / expList.length : 0,
      accountBreakdown: accArray,
      categoryBreakdown: catArray,
      merchantBreakdown: merchArray,
      monthlyBreakdown: monthArray,
      spendingBrackets: brackets,
    };
  }, [filteredTransactions, accounts, categories]);

  // Options for Fancy SmoothSelect Filter Dropdowns
  const dateOptions: SelectOption[] = [
    { value: 'all', label: 'All Time Records' },
    { value: 'today', label: 'Today Only' },
    { value: 'thisWeek', label: 'This Week (7 Days)' },
    { value: 'thisMonth', label: 'This Month' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year (2026)' },
    { value: 'custom', label: 'Custom Date Range...' },
  ];

  const accountOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'All Accounts' },
      ...accounts.map((acc: any) => ({
        value: acc.id,
        label: `${acc.name} (${acc.type || 'Account'})`,
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

  const typeOptions: SelectOption[] = [
    { value: '', label: 'All Types (Expenses, Income, Transfers)' },
    { value: 'expense', label: 'Expenses Only' },
    { value: 'income', label: 'Income Only' },
    { value: 'transfer', label: 'Transfers Only' },
  ];

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
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
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
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-accent-light transition-all"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Advanced Custom Filter Control Panel with Fancy SmoothSelect Dropdowns */}
      {isFilterOpen && (
        <div className="card p-5 border border-accent/30 bg-bg-card rounded-xl space-y-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
              <Filter size={16} className="text-accent" />
              <span>Multi-Dimensional Custom Report Filters</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-expense hover:underline cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset All Filters ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Fancy Date Preset Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Date Range Preset</label>
              <SmoothSelect
                value={timeRange}
                onChange={(val) => setTimeRange(val as any)}
                options={dateOptions}
                placeholder="Select Date Range..."
              />
            </div>

            {/* 2. Fancy Account Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Account Filter</label>
              <SmoothSelect
                value={accountFilter}
                onChange={(val) => setAccountFilter(val)}
                options={accountOptions}
                placeholder="All Accounts"
              />
            </div>

            {/* 3. Fancy Category Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Category Filter</label>
              <SmoothSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            {/* 4. Fancy Transaction Type Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Transaction Type</label>
              <SmoothSelect
                value={typeFilter}
                onChange={(val) => setTypeFilter(val)}
                options={typeOptions}
                placeholder="All Types"
              />
            </div>
          </div>

          {/* Custom Date Inputs & Amount Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
            {timeRange === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Min Amount (₹/$)</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Max Amount (₹/$)</label>
              <input
                type="number"
                placeholder="No Limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className={timeRange === 'custom' ? 'col-span-1 sm:col-span-2' : 'col-span-1 md:col-span-2'}>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Merchant / Notes Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter by vendor, item name or note..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-hover pl-9 pr-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
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
          <p className="text-xs text-text-muted">{incomeTxs.length} income deposits</p>
        </div>

        <div className="card p-5 border border-accent/30 bg-accent/5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-accent font-bold uppercase">
            <span>Average Expense</span>
            <DollarSign size={18} />
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">
            {formatPrivateCurrency(avgExpense)}
          </div>
          <p className="text-xs text-text-muted">Per transaction average</p>
        </div>

        <div className="card p-5 border border-border bg-bg-card rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase">
            <span>Top Category</span>
            <Tag size={18} className="text-accent" />
          </div>
          <div className="text-xl font-bold text-text-primary mt-1 truncate">
            {categoryBreakdown[0]?.name || 'N/A'}
          </div>
          <p className="text-xs text-text-muted">
            {categoryBreakdown[0] ? formatPrivateCurrency(categoryBreakdown[0].amount) : 'No data'}
          </p>
        </div>
      </div>

      {/* 5 Report Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1.5 bg-bg-card rounded-xl border border-border">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isActive = activeTab === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveTab(rep.id as any)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-white shadow-md font-bold scale-[1.02]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon size={16} />
              <span className="truncate">{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT 1: EXPENSES BY ACCOUNT */}
      {activeTab === 'account' && (
        <div className="card p-6 border border-border rounded-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Report 1: Expenses Breakdown by Account</h2>
              <p className="text-xs text-text-muted mt-0.5">Distribution of spending across your registered bank, cash, and credit accounts.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold border border-accent/20">
              {accountBreakdown.length} Active Accounts
            </span>
          </div>

          <div className="space-y-4">
            {accountBreakdown.length === 0 ? (
              <p className="text-text-muted text-center py-8">No account expense data recorded for this filter range.</p>
            ) : (
              accountBreakdown.map((acc) => {
                const percentage = totalExpenses > 0 ? ((acc.amount / totalExpenses) * 100).toFixed(1) : '0';
                const itemKey = `account-${acc.id || acc.name}`;
                const isExpanded = !!expandedItems[itemKey];

                return (
                  <div key={acc.name} className="p-4 rounded-xl border border-border bg-bg-secondary space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                        <span className="font-semibold text-text-primary">{acc.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg-card text-text-muted border border-border">
                          {acc.count} transactions
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-extrabold text-expense text-base">{formatPrivateCurrency(acc.amount)}</span>
                          <span className="text-xs text-text-muted ml-2 font-bold">({percentage}%)</span>
                        </div>
                        <button
                          onClick={() => toggleExpand(itemKey)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-bg-card hover:bg-bg-hover text-accent transition-all cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: acc.color }}
                      />
                    </div>

                    {/* Expandable Itemized Transactions */}
                    {isExpanded && <ItemizedTransactionSubTable transactions={acc.txs} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REPORT 2: EXPENSES BY CATEGORY */}
      {activeTab === 'category' && (
        <div className="card p-6 border border-border rounded-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Report 2: Expenses Breakdown by Category</h2>
              <p className="text-xs text-text-muted mt-0.5">Itemized distribution of spending per expense category.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-expense/15 text-expense text-xs font-bold border border-expense/20">
              {categoryBreakdown.length} Categories Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-text-muted text-center py-8 col-span-2">No category expense data found.</p>
            ) : (
              categoryBreakdown.map((cat) => {
                const pct = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : '0';
                const itemKey = `category-${cat.id || cat.name}`;
                const isExpanded = !!expandedItems[itemKey];

                return (
                  <div key={cat.name} className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-expense" />
                        <span className="font-bold text-text-primary">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-expense">{formatPrivateCurrency(cat.amount)}</span>
                        <button
                          onClick={() => toggleExpand(itemKey)}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg border border-border bg-bg-card hover:bg-bg-hover text-accent transition-all cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{cat.count} transactions</span>
                      <span className="font-bold text-text-primary">{pct}% of total</span>
                    </div>

                    <div className="w-full h-2 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className="h-full bg-expense rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Expandable Itemized Transactions */}
                    {isExpanded && <ItemizedTransactionSubTable transactions={cat.txs} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REPORT 3: TRANSACTION TYPE & CASH FLOW */}
      {activeTab === 'type' && (
        <div className="card p-6 border border-border rounded-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Report 3: Transaction Type & Cash Flow Analysis</h2>
              <p className="text-xs text-text-muted mt-0.5">Ratio of Expenses vs Income vs Internal Transfer Movements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expenses Block */}
            <div className="p-5 rounded-xl border border-expense/30 bg-expense/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-expense">Expense Outflow</span>
                <button
                  onClick={() => toggleExpand('type-expense')}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-expense/10 text-expense border border-expense/30 hover:bg-expense/20 transition-all cursor-pointer"
                >
                  <span>{expandedItems['type-expense'] ? 'Hide' : 'Expand'}</span>
                  {expandedItems['type-expense'] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              <div className="text-2xl font-black text-text-primary">{formatPrivateCurrency(totalExpenses)}</div>
              <p className="text-xs text-text-muted">{expenseTxs.length} records</p>

              {expandedItems['type-expense'] && <ItemizedTransactionSubTable transactions={expenseTxs} />}
            </div>

            {/* Income Block */}
            <div className="p-5 rounded-xl border border-income/30 bg-income/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-income">Income Inflow</span>
                <button
                  onClick={() => toggleExpand('type-income')}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-income/10 text-income border border-income/30 hover:bg-income/20 transition-all cursor-pointer"
                >
                  <span>{expandedItems['type-income'] ? 'Hide' : 'Expand'}</span>
                  {expandedItems['type-income'] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              <div className="text-2xl font-black text-text-primary">{formatPrivateCurrency(totalIncome)}</div>
              <p className="text-xs text-text-muted">{incomeTxs.length} records</p>

              {expandedItems['type-income'] && <ItemizedTransactionSubTable transactions={incomeTxs} />}
            </div>

            {/* Transfer Block */}
            <div className="p-5 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-accent">Transfer Volume</span>
                <button
                  onClick={() => toggleExpand('type-transfer')}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all cursor-pointer"
                >
                  <span>{expandedItems['type-transfer'] ? 'Hide' : 'Expand'}</span>
                  {expandedItems['type-transfer'] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              <div className="text-2xl font-black text-text-primary">{formatPrivateCurrency(totalTransfers)}</div>
              <p className="text-xs text-text-muted">{transferTxs.length} transfer pairs</p>

              {expandedItems['type-transfer'] && <ItemizedTransactionSubTable transactions={transferTxs} />}
            </div>
          </div>

          {/* Cash Flow Net Balance Box */}
          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-primary">Net Savings / Financial Velocity</span>
              <span className={`text-lg font-black ${totalIncome - totalExpenses >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatPrivateCurrency(totalIncome - totalExpenses)}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {totalIncome - totalExpenses >= 0
                ? 'Your income exceeds your expenses. You have a positive net savings flow.'
                : 'Expenses exceed income in this period.'}
            </p>
          </div>
        </div>
      )}

      {/* REPORT 4: SPENDING VELOCITY & TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="card p-6 border border-border rounded-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Report 4: Monthly Spending Velocity & Trends</h2>
              <p className="text-xs text-text-muted mt-0.5">Timeline overview of monthly spending vs income trends.</p>
            </div>
          </div>

          <div className="space-y-4">
            {monthlyBreakdown.length === 0 ? (
              <p className="text-text-muted text-center py-8">No monthly data available.</p>
            ) : (
              monthlyBreakdown.map((m) => {
                const itemKey = `month-${m.monthName}`;
                const isExpanded = !!expandedItems[itemKey];

                return (
                  <div key={m.monthName} className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-accent" />
                        <span className="font-bold text-text-primary">{m.monthName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">{m.count} records</span>
                        <button
                          onClick={() => toggleExpand(itemKey)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-bg-card hover:bg-bg-hover text-accent transition-all cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-text-muted block">Monthly Expense</span>
                        <span className="font-bold text-expense text-base">{formatPrivateCurrency(m.expense)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted block">Monthly Income</span>
                        <span className="font-bold text-income text-base">{formatPrivateCurrency(m.income)}</span>
                      </div>
                    </div>

                    {/* Expandable Itemized Transactions */}
                    {isExpanded && <ItemizedTransactionSubTable transactions={m.txs} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REPORT 5: TOP PAYEES & BRACKETS */}
      {activeTab === 'merchants' && (
        <div className="card p-6 border border-border rounded-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Report 5: Top Payees & Transaction Size Distribution</h2>
              <p className="text-xs text-text-muted mt-0.5">Ranked merchant targets and expenditure size tier analysis.</p>
            </div>
          </div>

          {/* Size Brackets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(spendingBrackets).map(([key, b]) => {
              const itemKey = `bracket-${key}`;
              const isExpanded = !!expandedItems[itemKey];

              return (
                <div key={key} className="p-4 rounded-xl border border-border bg-bg-secondary space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: b.color }}>{b.label}</span>
                    <button
                      onClick={() => toggleExpand(itemKey)}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-bg-card hover:bg-bg-hover text-accent transition-all cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                  <div className="text-xl font-extrabold text-text-primary">{formatPrivateCurrency(b.total)}</div>
                  <span className="text-xs text-text-muted block">{b.count} transactions</span>

                  {/* Expandable Itemized Transactions */}
                  {isExpanded && <ItemizedTransactionSubTable transactions={b.txs} />}
                </div>
              );
            })}
          </div>

          {/* Top 10 Merchants Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Top Spending Vendors / Payees</h3>
            <div className="space-y-2">
              {merchantBreakdown.length === 0 ? (
                <p className="text-text-muted text-center py-4">No merchant data found.</p>
              ) : (
                merchantBreakdown.map((m, idx) => {
                  const itemKey = `merchant-${m.name}`;
                  const isExpanded = !!expandedItems[itemKey];

                  return (
                    <div key={m.name} className="p-3 rounded-lg border border-border bg-bg-hover space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-text-primary">{m.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-text-muted">{m.count} txs</span>
                          <span className="font-bold text-expense">{formatPrivateCurrency(m.amount)}</span>
                          <button
                            onClick={() => toggleExpand(itemKey)}
                            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border border-border bg-bg-card hover:bg-bg-hover text-accent transition-all cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Itemized Transactions */}
                      {isExpanded && <ItemizedTransactionSubTable transactions={m.txs} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
