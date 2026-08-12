'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { useTransactions, useAccounts, useCategories, useGoals, useBudgets } from '@/lib/hooks/useFinance';
import { renderCategoryIcon, renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';
import { FancyDateTimePicker } from '@/components/ui/FancyDateTimePicker';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: any;
}

const toLocalISOString = (dateObj: Date) => {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return (
    dateObj.getFullYear() +
    '-' +
    pad(dateObj.getMonth() + 1) +
    '-' +
    pad(dateObj.getDate()) +
    'T' +
    pad(dateObj.getHours()) +
    ':' +
    pad(dateObj.getMinutes())
  );
};

export function AddTransactionModal({ isOpen, onClose, transactionToEdit }: AddTransactionModalProps) {
  const { createTransaction, updateTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { goals } = useGoals();
  const { budgets } = useBudgets();

  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [dateTime, setDateTime] = useState(toLocalISOString(new Date()));
  const [notes, setNotes] = useState('');
  const [excludeFromBalance, setExcludeFromBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId && !transactionToEdit) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) setTargetAccountId(accounts[1].id);
    }
  }, [accounts, accountId, transactionToEdit]);

  useEffect(() => {
    if (transactionToEdit) {
      const isTxTransfer = transactionToEdit.isTransfer || transactionToEdit.type === 'transfer';
      const resolvedType = isTxTransfer ? 'transfer' : (transactionToEdit.type || 'expense');
      setType(resolvedType);
      setAmount(transactionToEdit.amount ? Math.abs(parseFloat(transactionToEdit.amount)).toString() : '');

      // Decouple title and notes properly
      setTitle(transactionToEdit.title || '');
      setNotes(transactionToEdit.notes || transactionToEdit.description || '');

      const resolvedAccId = transactionToEdit.accountId || (typeof transactionToEdit.account === 'object' ? transactionToEdit.account?.id : '') || (accounts[0]?.id ?? '');
      setAccountId(resolvedAccId);

      const resolvedCatId = transactionToEdit.categoryId || (typeof transactionToEdit.category === 'object' ? transactionToEdit.category?.id : '');
      setCategoryId(resolvedCatId);

      setGoalId(transactionToEdit.goalId || '');
      setBudgetId(transactionToEdit.budgetId || '');

      if (transactionToEdit.date) {
        try {
          const d = new Date(transactionToEdit.date);
          if (!isNaN(d.getTime())) {
            setDateTime(toLocalISOString(d));
          } else {
            setDateTime(toLocalISOString(new Date()));
          }
        } catch (e) {
          setDateTime(toLocalISOString(new Date()));
        }
      } else {
        setDateTime(toLocalISOString(new Date()));
      }

      setExcludeFromBalance(!!transactionToEdit.excludeFromBalance);
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setNotes('');
      setExcludeFromBalance(false);
      setCategoryId('');
      setGoalId('');
      setBudgetId('');
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setDateTime(toLocalISOString(new Date()));
    }
  }, [transactionToEdit, isOpen, accounts]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const parsedDate = new Date(dateTime);
      const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, {
          title,
          amount: parseFloat(amount),
          type,
          accountId,
          categoryId: categoryId || null,
          goalId: goalId || null,
          budgetId: budgetId || null,
          date: isoDate,
          notes,
          excludeFromBalance,
        });
      } else {
        await createTransaction({
          title,
          amount: parseFloat(amount),
          type,
          accountId,
          categoryId: type === 'transfer' ? null : (categoryId || null),
          goalId: goalId || null,
          budgetId: budgetId || null,
          date: isoDate,
          notes,
          excludeFromBalance,
          targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-auto ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-bg-secondary">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="p-3.5 text-sm rounded-xl bg-expense/15 text-expense border border-expense/30 font-medium">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-bg-primary rounded-2xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'expense'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 scale-[1.02]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <TrendingDown size={15} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'income'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <TrendingUp size={15} />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'transfer'
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 scale-[1.02]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <ArrowRightLeft size={15} />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-extrabold rounded-2xl border border-border bg-bg-primary px-4 py-3.5 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Title / Merchant / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Groceries, Salary, Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Account & Category Pickers */}
          {type !== 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Account
                </label>
                <SmoothSelect
                  value={accountId}
                  onChange={(val) => setAccountId(val)}
                  searchable
                  placeholder="Select Account"
                  options={accounts.map((acc: any) => ({
                    value: acc.id,
                    label: acc.name,
                    icon: renderAccountIcon(acc.name, acc.type),
                    description: `${acc.currency || 'INR'} • ${formatCurrency(acc.currentBalance ?? acc.balance ?? 0)}`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Category
                </label>
                <SmoothSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  searchable
                  placeholder="Uncategorized"
                  options={[
                    { value: '', label: 'Uncategorized', icon: '🏷️' },
                    ...categories.map((cat: any) => ({
                      value: cat.id,
                      label: cat.name,
                      icon: renderCategoryIcon(cat.icon, cat.name),
                      description: `${cat.type.toUpperCase()}`,
                    })),
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  From Account
                </label>
                <SmoothSelect
                  value={accountId}
                  onChange={(val) => setAccountId(val)}
                  searchable
                  placeholder="Select From Account"
                  options={accounts.map((acc: any) => ({
                    value: acc.id,
                    label: acc.name,
                    icon: renderAccountIcon(acc.name, acc.type),
                    description: `${acc.currency || 'INR'} • ${formatCurrency(acc.currentBalance ?? acc.balance ?? 0)}`,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  To Account
                </label>
                <SmoothSelect
                  value={targetAccountId}
                  onChange={(val) => setTargetAccountId(val)}
                  searchable
                  placeholder="Select To Account"
                  options={accounts
                    .filter((acc: any) => acc.id !== accountId)
                    .map((acc: any) => ({
                      value: acc.id,
                      label: acc.name,
                      icon: renderAccountIcon(acc.name, acc.type),
                      description: `${acc.currency || 'INR'} • ${formatCurrency(acc.currentBalance ?? acc.balance ?? 0)}`,
                    }))}
                />
              </div>
            </div>
          )}

          {/* Budget & Goal Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Link to Monthly Budget (Optional)
              </label>
              <SmoothSelect
                value={budgetId}
                onChange={(val) => setBudgetId(val)}
                searchable
                placeholder="🚫 No Linked Budget"
                options={[
                  { value: '', label: '🚫 No Linked Budget' },
                  ...budgets.map((b: any) => ({
                    value: b.id,
                    label: b.name,
                    icon: '📊',
                    description: `Limit: ${formatCurrency(b.amount)}`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Link to Financial Goal (Optional)
              </label>
              <SmoothSelect
                value={goalId}
                onChange={(val) => setGoalId(val)}
                searchable
                placeholder="🚫 No Linked Goal"
                options={[
                  { value: '', label: '🚫 No Linked Goal' },
                  ...goals.map((g: any) => ({
                    value: g.id,
                    label: g.name,
                    icon: g.type === 'expense' ? '🔴' : '💚',
                    description: `Target: ${formatCurrency(g.targetAmount)}`,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Date & Time Selection Picker */}
          <FancyDateTimePicker
            value={dateTime}
            onChange={(val) => setDateTime(val)}
            label="Date & Time Selection"
          />

          {/* Notes / Description Textarea Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Notes / Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter additional notes, memo, or transaction details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary p-3.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all resize-y min-h-[85px] font-medium"
            />
          </div>

          {/* Exclude Amount Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-bg-secondary">
            <div>
              <span className="text-sm font-bold text-text-primary block">Exclude Amount</span>
              <span className="text-xs text-text-muted">
                Creates an entry without adding or subtracting from account balance.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExcludeFromBalance(!excludeFromBalance)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                excludeFromBalance ? 'bg-accent' : 'bg-bg-primary border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  excludeFromBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent-light hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
