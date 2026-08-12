'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mutate } from 'swr';
import { X, CheckCircle2, ArrowUpRight, ArrowDownLeft, HandCoins, Building2 } from 'lucide-react';
import { useTransactions, useAccounts, useCategories } from '@/lib/hooks/useFinance';
import { renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';
import { FancyDateTimePicker } from '@/components/ui/FancyDateTimePicker';

interface SettleLentBorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToSettle?: any;
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

export function SettleLentBorrowModal({ isOpen, onClose, recordToSettle }: SettleLentBorrowModalProps) {
  const { createTransaction, updateTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [mounted, setMounted] = useState(false);
  const [settleAccountId, setSettleAccountId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [dateTime, setDateTime] = useState(toLocalISOString(new Date()));
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
    if (recordToSettle) {
      const origAccId = recordToSettle.accountId || (typeof recordToSettle.account === 'object' ? recordToSettle.account?.id : '') || (accounts[0]?.id ?? '');
      setSettleAccountId(origAccId);
      setSettleAmount(recordToSettle.rawAmount ? recordToSettle.rawAmount.toString() : Math.abs(parseFloat(recordToSettle.amount || 0)).toString());

      const person = recordToSettle.personName || 'Contact';
      const isLent = recordToSettle.isLent;
      setNotes(`Settlement for ${isLent ? 'Lent loan to' : 'Borrowed debt from'} ${person}`);
      setDateTime(toLocalISOString(new Date()));
    }
  }, [recordToSettle, isOpen, accounts]);

  if (!isOpen || !mounted || !recordToSettle) return null;

  const isLent = recordToSettle.isLent;
  const person = recordToSettle.personName || 'Contact';
  const origAmount = recordToSettle.rawAmount || Math.abs(parseFloat(recordToSettle.amount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAmount || parseFloat(settleAmount) <= 0) {
      setError('Please enter a valid positive settlement amount');
      return;
    }
    if (!settleAccountId) {
      setError('Please select a settlement account');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const parsedDate = new Date(dateTime);
      const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
      const amountVal = parseFloat(settleAmount);

      // Find Category for Settlement
      const catName = isLent ? 'Income' : 'Expense';
      const matchedCat = categories.find((c: any) => c.name.toLowerCase().includes(catName.toLowerCase())) || categories[0];

      // 1. Create a real settlement transaction on the chosen Settlement Account
      // If setting a Borrowed debt (you borrowed money and are repaying it): Repayment is an EXPENSE from the settlement account.
      // If setting a Lent loan (you lent money and are collecting it): Collection is an INCOME to the settlement account.
      const settlementTxType = isLent ? 'income' : 'expense';
      const settlementTitle = isLent
        ? `Collected Loan from: ${person}`
        : `Repaid Debt to: ${person}`;

      const settlementNotes = `${notes.trim()} (Ref original debt: ${recordToSettle.id})`;

      await createTransaction({
        title: settlementTitle,
        amount: amountVal,
        type: settlementTxType,
        accountId: settleAccountId,
        categoryId: matchedCat?.id || null,
        date: isoDate,
        notes: settlementNotes,
        excludeFromBalance: false, // Must be false so it updates the settlement account balance!
      });

      // 2. Mark the original record as settled
      const origNotes = recordToSettle.notes || '';
      const updatedOrigNotes = origNotes.includes('[SETTLED]')
        ? origNotes
        : `[SETTLED via ${settleAccountId}] ${origNotes}`.trim();

      await updateTransaction(recordToSettle.id, {
        excludeFromBalance: false, // Keep false so original expense/income balances out with settlement tx
        notes: updatedOrigNotes,
      });

      // 3. Mutate accounts & transactions cache
      await mutate('/accounts');
      await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to settle debt record');
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
            <CheckCircle2 size={20} className="text-income" />
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Settle Debt & Repay
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

          {/* Record Summary Banner */}
          <div className="p-4 rounded-2xl border border-border bg-bg-primary space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase tracking-wider">
              <span>Original Debt Record</span>
              <span className={isLent ? 'text-expense font-bold' : 'text-income font-bold'}>
                {isLent ? '↗ Money Lent' : '↘ Money Borrowed'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-text-primary flex items-center gap-1.5">
                👤 {person}
              </span>
              <span className={`text-xl font-extrabold ${isLent ? 'text-expense' : 'text-income'}`}>
                {formatCurrency(origAmount)}
              </span>
            </div>
          </div>

          {/* Settlement Account Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5 flex items-center gap-1">
              <Building2 size={13} className="text-accent" />
              <span>Settlement Account (Account Used to Settle / Repay)</span>
            </label>
            <SmoothSelect
              value={settleAccountId}
              onChange={(val) => setSettleAccountId(val)}
              searchable
              placeholder="Select Settlement Account"
              options={accounts.map((acc: any) => ({
                value: acc.id,
                label: acc.name,
                icon: renderAccountIcon(acc.name, acc.type),
                description: `${acc.currency || 'INR'} • Current Balance: ${formatCurrency(acc.currentBalance ?? acc.balance ?? 0)}`,
              }))}
            />
            <span className="text-[11px] text-text-muted mt-1 block">
              {isLent
                ? 'Money collected will be deposited as Income into this account.'
                : 'Money repaid will be deducted as an Expense from this account.'}
            </span>
          </div>

          {/* Settlement Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Settlement Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              className="w-full text-2xl font-extrabold rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Date & Time Picker */}
          <FancyDateTimePicker
            value={dateTime}
            onChange={(val) => setDateTime(val)}
            label="Settlement Date & Time"
          />

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Settlement Memo / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Enter settlement notes or reference memo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary p-3 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all resize-y min-h-[70px] font-medium"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-income text-white shadow-lg shadow-income/25 hover:bg-income hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Settling...' : 'Confirm Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
