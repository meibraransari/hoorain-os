'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTransactions, useAccounts, useCategories, useGoals, useBudgets } from '@/lib/hooks/useFinance';
import { renderCategoryIcon, renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';

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
      
      setTitle(transactionToEdit.title || transactionToEdit.notes || '');

      const resolvedAccId = transactionToEdit.accountId || (typeof transactionToEdit.account === 'object' ? transactionToEdit.account?.id : '') || (accounts[0]?.id ?? '');
      setAccountId(resolvedAccId);

      const resolvedCatId = transactionToEdit.categoryId || (typeof transactionToEdit.category === 'object' ? transactionToEdit.category?.id : '');
      setCategoryId(resolvedCatId);

      setGoalId(transactionToEdit.goalId || '');
      setBudgetId(transactionToEdit.budgetId || '');

      // Format date and time ISO string
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

      setNotes(transactionToEdit.notes || '');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-text-primary">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-bg-hover rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                type === 'expense' ? 'bg-expense text-white shadow-md font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                type === 'income' ? 'bg-income text-white shadow-md font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                type === 'transfer' ? 'bg-accent text-white shadow-md font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Transfer
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Amount</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-2xl font-bold rounded-lg border border-border bg-bg-hover px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Title / Merchant / Description</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Salary, Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {type !== 'transfer' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Account</label>
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
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Category</label>
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
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">From Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer font-medium"
                >
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id} className="bg-bg-card text-text-primary py-1">
                      {renderAccountIcon(acc.name, acc.type)} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">To Account</label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer font-medium"
                >
                  {accounts.filter((acc: any) => acc.id !== accountId).map((acc: any) => (
                    <option key={acc.id} value={acc.id} className="bg-bg-card text-text-primary py-1">
                      {renderAccountIcon(acc.name, acc.type)} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Link to Monthly Budget & Link to Financial Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Link to Monthly Budget (Optional)</label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer font-medium"
              >
                <option value="" className="bg-bg-card text-text-primary">🚫 No Linked Budget</option>
                {budgets.map((b: any) => (
                  <option key={b.id} value={b.id} className="bg-bg-card text-text-primary py-1">
                    📊 {b.name} (Limit: {formatCurrency(b.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Link to Financial Goal (Optional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer font-medium"
              >
                <option value="" className="bg-bg-card text-text-primary">🚫 No Linked Goal</option>
                {goals.map((g: any) => (
                  <option key={g.id} value={g.id} className="bg-bg-card text-text-primary py-1">
                    {g.type === 'expense' ? '🔴' : '💚'} {g.name} (Target: {formatCurrency(g.targetAmount)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Input Field */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          {/* Bigger Notes / Description Textarea Box at Below Side */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Notes / Description</label>
            <textarea
              rows={4}
              placeholder="Enter additional notes, details, or transaction memo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover p-3 text-sm text-text-primary focus:border-accent focus:outline-none resize-y min-h-[90px]"
            />
          </div>

          {/* Exclude Amount Toggle Switch Button (below Notes / Description) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-bg-hover/60">
            <div>
              <span className="text-sm font-semibold text-text-primary block">Exclude Amount</span>
              <span className="text-xs text-text-muted">
                Creates a transaction entry without adding or subtracting from account balance.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExcludeFromBalance(!excludeFromBalance)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                excludeFromBalance ? 'bg-accent' : 'bg-bg-card border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  excludeFromBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50"
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
