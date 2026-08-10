'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PiggyBank, TrendingDown } from 'lucide-react';
import { useGoals, useAccounts } from '@/lib/hooks/useFinance';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: any;
}

export function AddGoalModal({ isOpen, onClose, goalToEdit }: AddGoalModalProps) {
  const { createGoal, updateGoal } = useGoals();
  const { accounts } = useAccounts();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [accountId, setAccountId] = useState('');
  const [deadline, setDeadline] = useState('');
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
    if (goalToEdit) {
      setName(goalToEdit.name || '');
      setTargetAmount(goalToEdit.targetAmount?.toString() || '');
      setCurrentAmount(goalToEdit.currentAmount?.toString() || '0');
      setType(goalToEdit.type === 'expense' ? 'expense' : 'income');
      setAccountId(goalToEdit.accountId || '');
      setDeadline(goalToEdit.deadline ? new Date(goalToEdit.deadline).toISOString().substring(0, 10) : '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setType('income');
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setDeadline('');
    }
  }, [goalToEdit, isOpen, accounts]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please provide a valid goal name and target amount');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (goalToEdit) {
        await updateGoal(goalToEdit.id, {
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          type,
          accountId: accountId || null,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });
      } else {
        await createGoal({
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          type,
          accountId: accountId || null,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-text-primary">
            {goalToEdit ? 'Edit Financial Goal' : 'Create Financial Goal'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}

          {/* Goal Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Goal Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-bg-hover rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'income' ? 'bg-income text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <PiggyBank size={15} />
                <span>Income / Savings Goal</span>
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense' ? 'bg-expense text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <TrendingDown size={15} />
                <span>Expense / Budget Goal</span>
              </button>
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              {type === 'income'
                ? '💚 Income / Savings Goals accumulate deposits towards your savings target.'
                : '🔴 Expense Goals track spending limits and deduct from your linked account balance.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop, Monthly Expense Limit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Linked Account (Optional)</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-bg-card text-text-primary">No Linked Account</option>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id} className="bg-bg-card text-text-primary">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">Linked account balance is affected when transactions match this goal.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Target Amount</label>
              <input
                type="number"
                step="any"
                placeholder="100000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Current Balance</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Target Deadline Date (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none"
            />
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
              {loading ? 'Saving...' : goalToEdit ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
