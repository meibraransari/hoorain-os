'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, CreditCard, Percent, DollarSign } from 'lucide-react';
import { useDebts } from '@/lib/hooks/useDebts';
import { SmoothSelect } from '@/components/ui/SmoothSelect';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: any;
}

const CATEGORY_OPTIONS = [
  { value: 'Credit Card', label: 'Credit Card Debt' },
  { value: 'Home Loan', label: 'Home Loan / Mortgage' },
  { value: 'Car Loan', label: 'Car / Vehicle Loan' },
  { value: 'Personal Loan', label: 'Personal Unsecured Loan' },
  { value: 'Education Loan', label: 'Student / Education Loan' },
  { value: 'Business Loan', label: 'Business / Enterprise Loan' },
  { value: 'Other', label: 'Other Debt' },
];

export function AddDebtModal({ isOpen, onClose, debtToEdit }: AddDebtModalProps) {
  const { createDebt, updateDebt } = useDebts();

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [extraPayment, setExtraPayment] = useState('0');
  const [category, setCategory] = useState('Credit Card');
  const [notes, setNotes] = useState('');
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
    if (debtToEdit) {
      setTitle(debtToEdit.title || '');
      setBalance(debtToEdit.balance ? debtToEdit.balance.toString() : '');
      setInterestRate(debtToEdit.interestRate ? debtToEdit.interestRate.toString() : '');
      setMinimumPayment(debtToEdit.minimumPayment ? debtToEdit.minimumPayment.toString() : '');
      setExtraPayment(debtToEdit.extraPayment !== undefined ? debtToEdit.extraPayment.toString() : '0');
      setCategory(debtToEdit.category || 'Credit Card');
      setNotes(debtToEdit.notes || '');
    } else {
      setTitle('');
      setBalance('');
      setInterestRate('');
      setMinimumPayment('');
      setExtraPayment('0');
      setCategory('Credit Card');
      setNotes('');
    }
  }, [debtToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a name for the loan or credit card');
      return;
    }
    if (!balance || parseFloat(balance) <= 0) {
      setError('Please enter a valid current balance');
      return;
    }
    if (!interestRate || parseFloat(interestRate) < 0) {
      setError('Please enter a valid interest rate (APR %)');
      return;
    }
    if (!minimumPayment || parseFloat(minimumPayment) <= 0) {
      setError('Please enter a valid minimum monthly payment');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (debtToEdit) {
        await updateDebt(debtToEdit.id, {
          title: title.trim(),
          balance: parseFloat(balance),
          interestRate: parseFloat(interestRate),
          minimumPayment: parseFloat(minimumPayment),
          extraPayment: parseFloat(extraPayment || '0'),
          category,
          notes: notes.trim(),
        });
      } else {
        await createDebt({
          title: title.trim(),
          balance: parseFloat(balance),
          interestRate: parseFloat(interestRate),
          minimumPayment: parseFloat(minimumPayment),
          extraPayment: parseFloat(extraPayment || '0'),
          category,
          notes: notes.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save debt record');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-auto ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-bg-secondary">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-accent" />
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              {debtToEdit ? 'Edit Loan / Debt Item' : 'Add Loan, Credit Card or Debt'}
            </h2>
          </div>
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

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Debt / Loan Title
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC Credit Card, Home Loan, SBI Car Loan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Balance & APR Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Current Owed Balance
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full text-lg font-bold rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Interest Rate (APR %)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 18.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full text-lg font-bold rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Min Payment & Extra Payment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Min Monthly Payment
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Optional Extra Monthly Payment
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Debt Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Category
            </label>
            <SmoothSelect
              value={category}
              onChange={(val) => setCategory(val)}
              options={CATEGORY_OPTIONS}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Notes / Account Reference
            </label>
            <textarea
              rows={2}
              placeholder="Enter loan account numbers or lender notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary p-3 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all resize-y min-h-[70px] font-medium"
            />
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
              {loading ? 'Saving...' : debtToEdit ? 'Update Debt' : 'Add Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
