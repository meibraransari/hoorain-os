'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mutate } from 'swr';
import { X, ArrowUpRight, ArrowDownLeft, User, HandCoins } from 'lucide-react';
import { useTransactions, useAccounts, useCategories } from '@/lib/hooks/useFinance';
import { renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';
import { FancyDateTimePicker } from '@/components/ui/FancyDateTimePicker';

interface AddLentBorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: any;
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

export function AddLentBorrowModal({ isOpen, onClose, recordToEdit }: AddLentBorrowModalProps) {
  const { createTransaction, updateTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [mounted, setMounted] = useState(false);
  const [lentType, setLentType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dateTime, setDateTime] = useState(toLocalISOString(new Date()));
  const [notes, setNotes] = useState('');
  const [isSettled, setIsSettled] = useState(false);
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
    if (accounts.length > 0 && !accountId && !recordToEdit) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId, recordToEdit]);

  useEffect(() => {
    if (recordToEdit) {
      const isLent = recordToEdit.type === 'expense' || (recordToEdit.category?.name || '').toLowerCase().includes('lent');
      setLentType(isLent ? 'lent' : 'borrowed');
      setAmount(recordToEdit.amount ? Math.abs(parseFloat(recordToEdit.amount)).toString() : '');

      // Extract person name from title or notes
      const titleText = recordToEdit.title || '';
      const notesText = recordToEdit.notes || '';
      let person = titleText.replace(/^(Lent to|Borrowed from|Lent|Borrowed):\s*/i, '').trim();
      if (!person && notesText) {
        person = notesText.split('\n')[0].replace(/^(Lent to|Borrowed from|Lent|Borrowed):\s*/i, '').trim();
      }
      setPersonName(person || titleText || 'Person');

      const resolvedAccId = recordToEdit.accountId || (typeof recordToEdit.account === 'object' ? recordToEdit.account?.id : '') || (accounts[0]?.id ?? '');
      setAccountId(resolvedAccId);

      if (recordToEdit.date) {
        try {
          const d = new Date(recordToEdit.date);
          if (!isNaN(d.getTime())) {
            setDateTime(toLocalISOString(d));
          } else {
            setDateTime(toLocalISOString(new Date()));
          }
        } catch (e) {
          setDateTime(toLocalISOString(new Date()));
        }
      }

      setNotes(recordToEdit.notes || '');
      setIsSettled(Boolean(recordToEdit.excludeFromBalance || notesText.includes('[SETTLED]')));
    } else {
      setLentType('lent');
      setPersonName('');
      setAmount('');
      setNotes('');
      setIsSettled(false);
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setDateTime(toLocalISOString(new Date()));
    }
  }, [recordToEdit, isOpen, accounts]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!personName.trim()) {
      setError('Please enter the person or contact name');
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

      // Find or match existing category for Lent or Borrowed
      const catName = lentType === 'lent' ? 'Lent' : 'Borrowed';
      const matchedCat = categories.find((c: any) => c.name.toLowerCase() === catName.toLowerCase()) || categories[0];

      const txTitle = `${lentType === 'lent' ? 'Lent to' : 'Borrowed from'}: ${personName.trim()}`;
      const memoNotes = isSettled
        ? `[SETTLED] ${notes.trim()}`
        : notes.trim();

      const txType = lentType === 'lent' ? 'expense' : 'income';

      if (recordToEdit) {
        await updateTransaction(recordToEdit.id, {
          title: txTitle,
          amount: parseFloat(amount),
          type: txType,
          accountId,
          categoryId: matchedCat?.id || null,
          date: isoDate,
          notes: memoNotes,
          excludeFromBalance: isSettled,
        });
      } else {
        await createTransaction({
          title: txTitle,
          amount: parseFloat(amount),
          type: txType,
          accountId,
          categoryId: matchedCat?.id || null,
          date: isoDate,
          notes: memoNotes,
          excludeFromBalance: isSettled,
        });
      }
      await mutate('/accounts');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-[#141420] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden my-auto ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26263a] px-6 py-4 bg-[#181826]">
          <div className="flex items-center gap-2">
            <HandCoins size={20} className="text-[#6c63ff]" />
            <h2 className="text-xl font-bold tracking-tight text-[#ffffff]">
              {recordToEdit ? 'Edit Debt Record' : 'Record Money Lent / Borrowed'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234] transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="p-3.5 text-sm rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium">
              {error}
            </div>
          )}

          {/* Type Switcher: Lent vs Borrowed */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0e0e17] rounded-2xl border border-[#242436]">
            <button
              type="button"
              onClick={() => setLentType('lent')}
              className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                lentType === 'lent'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 scale-[1.02]'
                  : 'text-[#8888a8] hover:text-[#ffffff] hover:bg-[#1a1a28]'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>I Lent Money (Given)</span>
            </button>

            <button
              type="button"
              onClick={() => setLentType('borrowed')}
              className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                lentType === 'borrowed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'text-[#8888a8] hover:text-[#ffffff] hover:bg-[#1a1a28]'
              }`}
            >
              <ArrowDownLeft size={16} />
              <span>I Borrowed Money (Taken)</span>
            </button>
          </div>

          {/* Person / Contact Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Person / Contact Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8888a8]" />
              <input
                type="text"
                placeholder="e.g. Irshad Bhai, Flat Almasheera, Abbu"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] pl-10 pr-4 py-2.5 text-sm text-[#ffffff] font-medium focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Hero Amount Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-extrabold rounded-2xl border border-[#2b2b40] bg-[#10101a] px-4 py-3.5 text-[#ffffff] focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Account Used
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

          {/* Date & Time Picker */}
          <FancyDateTimePicker
            value={dateTime}
            onChange={(val) => setDateTime(val)}
            label="Transaction Date"
          />

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Notes / Description / Due Date Details
            </label>
            <textarea
              rows={3}
              placeholder="Enter loan reason, repayment promises, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] p-3.5 text-sm text-[#ffffff] focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all resize-y min-h-[80px] font-medium"
            />
          </div>

          {/* Settled Status Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#26263a] bg-[#181826]">
            <div>
              <span className="text-sm font-bold text-[#ffffff] block">Mark as Settled / Repaid</span>
              <span className="text-xs text-[#8888a8]">
                Settled records represent fully repaid loans and don't affect pending debts.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettled(!isSettled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSettled ? 'bg-[#10d88a]' : 'bg-[#10101a] border-[#2b2b40]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isSettled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#26263a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#8888a8] hover:text-[#ffffff] hover:bg-[#1f1f2e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#6c63ff] text-white shadow-lg shadow-[#6c63ff]/30 hover:bg-[#8b85ff] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : recordToEdit ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
