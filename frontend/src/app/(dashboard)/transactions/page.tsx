'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, isToday, isYesterday } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/lib/hooks/useFinance';
import { useSettings } from '@/components/providers/SettingsProvider';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { api } from '@/lib/api';
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Download, TrendingDown } from 'lucide-react';

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

  useEffect(() => {
    if (accountParam) {
      setSearch(accountParam);
    }
  }, [accountParam]);

  const { transactions: rawTransactions, total, isLoading, deleteTransaction } = useTransactions({
    page,
    limit,
    type: typeFilter || undefined,
    search: search || undefined,
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-text-primary">Transactions</h1>
            {typeFilter === 'expense' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-expense/15 text-expense border border-expense/30 animate-pulse">
                <TrendingDown size={14} />
                <span>Expenses Only Active</span>
              </span>
            )}
          </div>
          <p className="text-text-secondary mt-1">
            {total > 0 ? `Showing ${startRecord}-${endRecord} of ${total} total transactions` : 'View, search, and manage all financial records.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const response: any = await api.get('/export/transactions?format=csv', { responseType: 'blob' });
                const blob = new Blob([response.data || response], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'transactions.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                alert('Export failed');
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter, Limit and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between card p-4 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search transactions by title or note..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg-card pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className={typeFilter === 'expense' ? 'text-expense' : 'text-text-muted'} />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className={`rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors cursor-pointer ${
                typeFilter === 'expense'
                  ? 'border-expense bg-expense/20 text-expense font-bold'
                  : typeFilter === 'income'
                  ? 'border-income bg-income/20 text-income font-bold'
                  : typeFilter === 'transfer'
                  ? 'border-accent bg-accent/20 text-accent font-bold'
                  : 'border-border bg-bg-card text-text-primary focus:border-accent'
              }`}
            >
              <option value="" className="bg-bg-card text-text-primary">All Transaction Types</option>
              <option value="expense" className="bg-bg-card text-expense font-semibold">Expenses Only</option>
              <option value="income" className="bg-bg-card text-income font-semibold">Income Only</option>
              <option value="transfer" className="bg-bg-card text-accent font-semibold">Transfers Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Per Page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value={20} className="bg-bg-card text-text-primary">20</option>
              <option value={50} className="bg-bg-card text-text-primary">50</option>
              <option value={100} className="bg-bg-card text-text-primary">100</option>
              <option value={250} className="bg-bg-card text-text-primary">250</option>
              <option value={500} className="bg-bg-card text-text-primary">500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 border border-border rounded-xl bg-bg-secondary flex flex-col">
            <span className="text-xs font-semibold uppercase text-text-muted">Inflow (Period)</span>
            <span className="text-xl font-bold text-income mt-1">+{formatCurrency(periodIncome)}</span>
          </div>
          <div className="card p-4 border border-border rounded-xl bg-bg-secondary flex flex-col">
            <span className="text-xs font-semibold uppercase text-text-muted">Outflow (Period)</span>
            <span className="text-xl font-bold text-text-primary mt-1">-{formatCurrency(periodExpense)}</span>
          </div>
          <div className="card p-4 border border-border rounded-xl bg-bg-secondary flex flex-col">
            <span className="text-xs font-semibold uppercase text-text-muted">Net Change</span>
            <span className={`text-xl font-bold mt-1 ${periodIncome - periodExpense >= 0 ? 'text-income' : 'text-expense'}`}>
              {periodIncome - periodExpense >= 0 ? '+' : ''}{formatCurrency(periodIncome - periodExpense)}
            </span>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className={`card border rounded-xl overflow-hidden transition-colors ${
        typeFilter === 'expense' ? 'border-expense/40 shadow-expense/5' : 'border-border'
      }`}>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-text-muted space-y-3">
            <ArrowUpDown size={40} className="mx-auto text-text-muted/40" />
            <p className="text-lg font-medium text-text-primary">No transactions found</p>
            <p className="text-sm">Try adjusting your search query or filter options.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {Object.entries(groupedTransactions).map(([dateLabel, group]: [string, any]) => (
              <div key={dateLabel} className="border-b border-border last:border-b-0">
                {/* Sticky Group Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-card/95 backdrop-blur-md px-4 py-2 border-b border-border/40 shadow-sm">
                  <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider">{dateLabel}</h3>
                  <div className="text-[13px] font-semibold text-text-muted">
                    {group.netTotal >= 0 ? '+' : ''}{formatCurrency(group.netTotal)}
                  </div>
                </div>

                {/* Group Transactions */}
                <div className="flex flex-col">
                  {group.transactions.map((tx: any) => (
                    <div key={tx.id} className="relative group flex items-center justify-between hover:bg-bg-hover transition-colors pr-2">
                      <div className="flex-1">
                        <TransactionItem transaction={tx} />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 rounded-md bg-bg-secondary border border-border text-text-muted hover:text-accent hover:border-accent transition-colors shadow-sm"
                          title="Edit Transaction"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-md bg-bg-secondary border border-border text-text-muted hover:text-expense hover:border-expense transition-colors shadow-sm"
                          title="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border p-4 bg-bg-card">
            <span className="text-sm text-text-muted">
              Page <strong className="text-text-primary">{page}</strong> of <strong className="text-text-primary">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-hover text-sm font-medium text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-card transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-hover text-sm font-medium text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-card transition-colors"
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
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading Transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
