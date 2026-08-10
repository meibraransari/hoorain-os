'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBudgets } from '@/lib/hooks/useFinance';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: any;
}

export function AddBudgetModal({ isOpen, onClose, budgetToEdit }: AddBudgetModalProps) {
  const { createBudget, updateBudget } = useBudgets();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [color, setColor] = useState('#6c63ff');
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
    if (budgetToEdit) {
      setName(budgetToEdit.name || '');
      setAmount(budgetToEdit.amount?.toString() || '');
      setPeriod(budgetToEdit.period || 'monthly');
      setColor(budgetToEdit.color || '#6c63ff');
    } else {
      setName('');
      setAmount('');
      setPeriod('monthly');
      setColor('#6c63ff');
    }
  }, [budgetToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Please provide a valid budget name and target amount');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (budgetToEdit) {
        await updateBudget(budgetToEdit.id, {
          name,
          amount: parseFloat(amount),
          period,
          color,
        });
      } else {
        await createBudget({
          name,
          amount: parseFloat(amount),
          period,
          color,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-text-primary">
            {budgetToEdit ? 'Edit Budget Limit' : 'Set Up New Budget'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Budget Name / Category</label>
            <input
              type="text"
              placeholder="e.g. Monthly Groceries, Dining Out, Utilities"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Spending Limit</label>
              <input
                type="number"
                step="any"
                placeholder="15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Budget Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer capitalize"
              >
                <option value="monthly" className="bg-bg-card text-text-primary">Monthly</option>
                <option value="weekly" className="bg-bg-card text-text-primary">Weekly</option>
                <option value="yearly" className="bg-bg-card text-text-primary">Yearly</option>
              </select>
            </div>
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
              {loading ? 'Saving...' : budgetToEdit ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
