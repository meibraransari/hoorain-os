'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  format,
  isToday,
  isYesterday,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/lib/hooks/useFinance';
import { useSettings } from '@/components/providers/SettingsProvider';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { DeleteTransactionModal } from '@/components/modals/DeleteTransactionModal';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingDown,
  Calendar,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
} from 'lucide-react';

function TransactionsContent() {
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const accountParam = searchParams.get('account') || searchParams.get('accountId') || '';

  const [search, setSearch] = useState(accountParam);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);

  // Date Filtering State
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (accountParam) {
      setSearch(accountParam);
    }
  }, [accountParam]);

  const handleSelectDateRange = (start: string, end: string, presetKey: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset(presetKey);
    setPage(1);
  };

  const handleQuickPresetChange = (preset: string) => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (preset === 'last_week') {
      const lastWeekDate = subWeeks(now, 1);
      const start = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
      const end = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (preset === 'this_month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (preset === 'last_month') {
      const lastMonthDate = subMonths(now, 1);
      const start = startOfMonth(lastMonthDate);
      const end = endOfMonth(lastMonthDate);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (preset === 'this_year') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const { transactions: rawTransactions, total, summary, isLoading, deleteTransaction } = useTransactions({
    page,
    limit,
    type: typeFilter || undefined,
    search: search || undefined,
    from: startDate || undefined,
    to: endDate || undefined,
  });

  const transactions = useMemo(() => {
    if (!settings?.removeZeroTransactionEntries) return rawTransactions;
    return rawTransactions.filter((tx: any) => Math.abs(parseFloat(tx.amount || 0)) > 0);
  }, [rawTransactions, settings?.removeZeroTransactionEntries]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleEdit = (tx: any) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (tx: any) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete?.id) {
      await deleteTransaction(transactionToDelete.id);
    }
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(total, page * limit);

  const { groupedTransactions, periodIncome, periodExpense } = useMemo(() => {
    if (!transactions || transactions.length === 0) return { groupedTransactions: {}, periodIncome: 0, periodExpense: 0 };

    let inc = 0;
    let exp = 0;

    const grouped = transactions.reduce((acc: any, tx: any) => {
      let dateKey = 'Unknown Date';
      if (tx.date) {
        try {
          const d = new Date(tx.date);
          if (isToday(d)) dateKey = 'Today';
          else if (isYesterday(d)) dateKey = 'Yesterday';
          else dateKey = format(d, 'EEEE, MMMM d, yyyy');
        } catch (e) {}
      }
      if (!acc[dateKey]) {
        acc[dateKey] = { transactions: [], netTotal: 0 };
      }
      acc[dateKey].transactions.push(tx);

      const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0;
      const isTransfer = tx.isTransfer || tx.type === 'transfer';
      const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);

      if (!isTransfer) {
        if (isIncome) inc += rawAmount;
        else exp += rawAmount;
        acc[dateKey].netTotal += (isIncome ? rawAmount : -rawAmount);
      }

      return acc;
    }, {});

    return { groupedTransactions: grouped, periodIncome: inc, periodExpense: exp };
  }, [transactions]);

  const displayIncome = summary ? summary.income : periodIncome;
  const displayExpense = summary ? summary.expense : periodExpense;
  const displayNet = summary ? summary.net : (displayIncome - displayExpense);

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('format', 'csv');
      if (search) queryParams.set('search', search);
      if (typeFilter) queryParams.set('type', typeFilter);
      if (startDate) queryParams.set('from', startDate);
      if (endDate) queryParams.set('to', endDate);
      if (accountParam) queryParams.set('accountId', accountParam);

      const response: any = await api.get(`/export/transactions?${queryParams.toString()}`, { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Export failed');
    }
  };

  const isDateFiltered = Boolean(startDate || endDate || (datePreset && datePreset !== 'all'));

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#ffffff]">
              Transactions
            </h1>
            {typeFilter === 'expense' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <TrendingDown size={14} />
                <span>Expenses Only</span>
              </span>
            )}
            {isDateFiltered && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/40 shadow-xs">
                <Sparkles size={14} />
                <span>Filtered Period</span>
              </span>
            )}
          </div>
          <p className="text-[#a0a0cc] mt-1 font-medium">
            {total > 0
              ? `Showing ${startRecord}-${endRecord} of ${total} total transactions`
              : 'View, search, and manage all financial records.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#2b2b40] bg-[#141420] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#1f1f30] hover:border-[#6c63ff]/50 transition-all cursor-pointer shadow-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#6c63ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6c63ff]/30 transition-all hover:bg-[#8b85ff] hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Primary Search & Filters Toolbar */}
      <div className="flex flex-col gap-4 p-5 border border-[#26263a] rounded-2xl bg-[#141420] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8888a8]" />
            <input
              type="text"
              placeholder="Search transactions by title, note, or merchant..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] pl-10 pr-4 py-2.5 text-sm text-[#ffffff] font-medium focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Transaction Type Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter size={16} className={typeFilter === 'expense' ? 'text-rose-400' : 'text-[#8888a8]'} />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className={`rounded-xl border px-3.5 py-2 text-sm font-semibold focus:outline-none transition-all cursor-pointer shadow-xs ${
                  typeFilter === 'expense'
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 font-bold'
                    : typeFilter === 'income'
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-bold'
                    : typeFilter === 'transfer'
                    ? 'border-violet-500/50 bg-violet-500/20 text-violet-300 font-bold'
                    : 'border-[#2b2b40] bg-[#10101a] text-[#ffffff] hover:border-[#6c63ff]/50'
                }`}
              >
                <option value="" className="bg-[#141420] text-[#ffffff] font-semibold">All Transaction Types</option>
                <option value="expense" className="bg-[#141420] text-rose-400 font-bold">Expenses Only</option>
                <option value="income" className="bg-[#141420] text-emerald-400 font-bold">Income Only</option>
                <option value="transfer" className="bg-[#141420] text-violet-400 font-bold">Transfers Only</option>
              </select>
            </div>

            {/* Per Page Limit */}
            <div className="flex items-center gap-2 text-sm text-[#8888a8] font-medium">
              <span>Per Page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-[#2b2b40] bg-[#10101a] px-3 py-2 text-sm font-bold text-[#ffffff] focus:border-[#6c63ff] focus:outline-none cursor-pointer"
              >
                <option value={20} className="bg-[#141420] text-[#ffffff]">20</option>
                <option value={50} className="bg-[#141420] text-[#ffffff]">50</option>
                <option value={100} className="bg-[#141420] text-[#ffffff]">100</option>
                <option value={250} className="bg-[#141420] text-[#ffffff]">250</option>
                <option value={500} className="bg-[#141420] text-[#ffffff]">500</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Toolbar Row */}
        <div className="border-t border-[#242436] pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8888a8] uppercase tracking-wider mr-1">
              <Calendar size={15} className="text-[#6c63ff]" />
              <span>Date Filter:</span>
            </div>

            {/* Custom Date Range Picker Popover */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              datePreset={datePreset}
              onSelectRange={handleSelectDateRange}
            />

            {/* Instant Filter Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'this_week', label: 'This Week' },
                { key: 'this_month', label: 'This Month' },
                { key: 'last_month', label: 'Last Month' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleQuickPresetChange(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    datePreset === p.key
                      ? 'bg-[#6c63ff] text-white shadow-md shadow-[#6c63ff]/30 scale-105'
                      : 'bg-[#1c1c2b] text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Date Filter Reset Button */}
          {isDateFiltered && (
            <button
              type="button"
              onClick={() => handleQuickPresetChange('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2b2b40] bg-[#10101a] text-xs font-bold text-[#8888a8] hover:text-rose-400 hover:border-rose-500/50 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Clear Date Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      {(transactions.length > 0 || (summary && (summary.income > 0 || summary.expense > 0))) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inflow Card */}
          <div className="p-4 border border-[#242436] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Inflow (Period)</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-[#10d88a] tracking-tight mt-2">
              +{formatCurrency(displayIncome)}
            </span>
          </div>

          {/* Outflow Card */}
          <div className="p-4 border border-[#242436] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-rose-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Outflow (Period)</span>
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 group-hover:scale-110 transition-transform">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-[#ffffff] tracking-tight mt-2">
              -{formatCurrency(displayExpense)}
            </span>
          </div>

          {/* Net Change Card */}
          <div className="p-4 border border-[#242436] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-[#6c63ff]/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Net Change</span>
              <div className="p-2 rounded-xl bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30 group-hover:scale-110 transition-transform">
                <Wallet size={16} />
              </div>
            </div>
            <span
              className={`text-2xl font-extrabold tracking-tight mt-2 ${
                displayNet >= 0 ? 'text-[#10d88a]' : 'text-[#ff5572]'
              }`}
            >
              {displayNet >= 0 ? '+' : ''}{formatCurrency(displayNet)}
            </span>
          </div>
        </div>
      )}

      {/* Transactions List Container */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-xl bg-[#12121c] transition-all ${
          typeFilter === 'expense' ? 'border-rose-500/30' : 'border-[#26263a]'
        }`}
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl skeleton bg-[#181826]" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-14 text-center text-[#8888a8] space-y-3">
            <ArrowUpDown size={44} className="mx-auto text-[#555577]" />
            <p className="text-lg font-bold text-[#ffffff]">No transactions found</p>
            <p className="text-sm">Try adjusting your search query, date filter, or category options.</p>
            {isDateFiltered && (
              <button
                type="button"
                onClick={() => handleQuickPresetChange('all')}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6c63ff] text-white text-xs font-bold shadow-md hover:bg-[#8b85ff] transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Show All Time Transactions</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col p-2 space-y-1">
            {Object.entries(groupedTransactions).map(([dateLabel, group]: [string, any]) => (
              <div key={dateLabel} className="space-y-1">
                {/* Sticky High-Contrast Date Header Strip */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-[#181826] px-4 py-2 rounded-xl border border-[#2b2b40] my-1.5 shadow-sm">
                  <h3 className="text-xs font-extrabold text-[#ffffff] uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <div className="text-xs font-bold text-[#a0a0cc]">
                    {group.netTotal >= 0 ? '+' : ''}{formatCurrency(group.netTotal)}
                  </div>
                </div>

                {/* Group Transactions Items */}
                <div className="flex flex-col">
                  {group.transactions.map((tx: any) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      action={
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(tx);
                            }}
                            className="p-1.5 rounded-lg bg-[#1a1a28] border border-[#2b2b40] text-[#8888a8] hover:text-[#6c63ff] hover:border-[#6c63ff] transition-colors shadow-xs cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(tx);
                            }}
                            className="p-1.5 rounded-lg bg-[#1a1a28] border border-[#2b2b40] text-[#8888a8] hover:text-rose-400 hover:border-rose-500/50 transition-colors shadow-xs cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#242436] p-4 bg-[#141420]">
            <span className="text-sm text-[#8888a8] font-medium">
              Page <strong className="text-[#ffffff]">{page}</strong> of <strong className="text-[#ffffff]">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-sm font-semibold text-[#ffffff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#222234] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-sm font-semibold text-[#ffffff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#222234] transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionToEdit={transactionToEdit}
      />

      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        transaction={transactionToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#8888a8]">Loading Transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
