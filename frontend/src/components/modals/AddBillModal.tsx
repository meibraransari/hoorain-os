'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarClock, CreditCard, Tag, Sparkles } from 'lucide-react';
import { useAccounts, useCategories } from '@/lib/hooks/useFinance';
import { useRecurring } from '@/lib/hooks/useRecurring';
import { renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: any;
}

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly (e.g. Rent, Netflix, Internet)' },
  { value: 'yearly', label: 'Yearly (e.g. Annual Policy, Domain, Taxes)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly (Every 2 weeks)' },
  { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  { value: 'daily', label: 'Daily' },
];

export function AddBillModal({ isOpen, onClose, ruleToEdit }: AddBillModalProps) {
  const { createRecurring, updateRecurring } = useRecurring();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
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
    if (accounts.length > 0 && !accountId && !ruleToEdit) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId, ruleToEdit]);

  useEffect(() => {
    if (ruleToEdit) {
      setTitle(ruleToEdit.title || '');
      setAmount(ruleToEdit.rawAmount ? ruleToEdit.rawAmount.toString() : Math.abs(parseFloat(ruleToEdit.amount || 0)).toString());
      setType(ruleToEdit.type || 'expense');
      setAccountId(ruleToEdit.accountId || (typeof ruleToEdit.account === 'object' ? ruleToEdit.account?.id : '') || (accounts[0]?.id ?? ''));
      setCategoryId(ruleToEdit.categoryId || (typeof ruleToEdit.category === 'object' ? ruleToEdit.category?.id : '') || '');
      setFrequency(ruleToEdit.frequency || 'monthly');
      setNextDate(ruleToEdit.nextDate ? ruleToEdit.nextDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
      setNotes(ruleToEdit.notes || '');
      setIsActive(ruleToEdit.isActive !== false);
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setFrequency('monthly');
      setNotes('');
      setIsActive(true);
      if (accounts.length > 0) setAccountId(accounts[0].id);
      if (categories.length > 0) setCategoryId(categories[0].id);
      setNextDate(new Date().toISOString().substring(0, 10));
    }
  }, [ruleToEdit, isOpen, accounts, categories]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title or name for the bill/subscription');
      return;
    }
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
      if (ruleToEdit) {
        await updateRecurring(ruleToEdit.id, {
          title: title.trim(),
          amount: parseFloat(amount),
          type,
          accountId,
          categoryId: categoryId || undefined,
          frequency: frequency as any,
          nextDate,
          notes: notes.trim(),
          isActive,
        });
      } else {
        await createRecurring({
          title: title.trim(),
          amount: parseFloat(amount),
          type,
          accountId,
          categoryId: categoryId || undefined,
          frequency: frequency as any,
          nextDate,
          notes: notes.trim(),
          isActive,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save bill rule');
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
            <CalendarClock size={20} className="text-[#6c63ff]" />
            <h2 className="text-xl font-bold tracking-tight text-[#ffffff]">
              {ruleToEdit ? 'Edit Bill / Subscription Rule' : 'Add Bill, Rent or Subscription'}
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

          {/* Title / Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Bill / Subscription Name
            </label>
            <input
              type="text"
              placeholder="e.g. Home Rent, Netflix, Electricity Bill, Salary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] px-4 py-2.5 text-sm text-[#ffffff] font-medium focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Amount Field */}
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
              className="w-full text-3xl font-extrabold rounded-2xl border border-[#2b2b40] bg-[#10101a] px-4 py-3 text-[#ffffff] focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Frequency & Next Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
                Frequency
              </label>
              <SmoothSelect
                value={frequency}
                onChange={(val) => setFrequency(val)}
                options={FREQUENCY_OPTIONS}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
                Next Due Date
              </label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] px-4 py-2.5 text-sm text-[#ffffff] font-medium focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
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

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Category (Optional)
            </label>
            <SmoothSelect
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              searchable
              placeholder="Select Category"
              options={categories.map((cat: any) => ({
                value: cat.id,
                label: cat.name,
                description: cat.type ? cat.type.toUpperCase() : undefined,
              }))}
            />
          </div>

          {/* Notes / Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Notes / Provider Details
            </label>
            <textarea
              rows={2}
              placeholder="Enter provider details, policy numbers, or account references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] p-3 text-sm text-[#ffffff] focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all resize-y min-h-[70px] font-medium"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#26263a] bg-[#181826]">
            <div>
              <span className="text-sm font-bold text-[#ffffff] block">Active Rule Status</span>
              <span className="text-xs text-[#8888a8]">
                Inactive rules are paused and don't trigger overdue/upcoming alerts.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-[#10d88a]' : 'bg-[#10101a] border-[#2b2b40]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
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
              {loading ? 'Saving...' : ruleToEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
