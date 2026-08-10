'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Globe } from 'lucide-react';
import { useAccounts, useAccountTypes } from '@/lib/hooks/useFinance';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: any;
}

export function AddAccountModal({ isOpen, onClose, accountToEdit }: AddAccountModalProps) {
  const { createAccount, updateAccount } = useAccounts();
  const { accountTypes } = useAccountTypes();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#3f51b5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultCurrency = typeof window !== 'undefined' ? localStorage.getItem('defaultCurrency') || 'INR' : 'INR';

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
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setType(accountToEdit.type || 'checking');
      setInitialBalance(accountToEdit.initialBalance?.toString() || '0');
      setColor(accountToEdit.color || '#3f51b5');
    } else {
      setName('');
      setType(accountTypes[0]?.code || 'checking');
      setInitialBalance('0');
      setColor('#3f51b5');
    }
  }, [accountToEdit, isOpen, accountTypes]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (accountToEdit) {
        await updateAccount(accountToEdit.id, {
          name,
          type,
          currency: defaultCurrency,
          initialBalance: parseFloat(initialBalance) || 0,
          color,
        });
      } else {
        await createAccount({
          name,
          type,
          currency: defaultCurrency,
          initialBalance: parseFloat(initialBalance) || 0,
          color,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#3f51b5', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#607d8b', '#795548'];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-text-primary">
            {accountToEdit ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Account Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Salary, SBI Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none capitalize cursor-pointer"
            >
              {accountTypes.map((t: any) => (
                <option key={t.id || t.code} value={t.code || t.name.toLowerCase()} className="bg-bg-card text-text-primary">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Currency Info Badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg-secondary text-xs text-text-muted">
            <Globe size={14} className="text-accent" />
            <span>Currency: <strong className="text-text-primary uppercase">{defaultCurrency}</strong> (configured in Settings)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Initial Opening Balance</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-text-muted mt-1">Set opening balance to calibrate Net Worth calculations.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={16} className="text-white" />}
                </button>
              ))}
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
              {loading ? 'Saving...' : accountToEdit ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
