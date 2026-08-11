'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, CreditCard, CalendarClock, DollarSign } from 'lucide-react';
import { useAccounts } from '@/lib/hooks/useFinance';
import { useRecurring } from '@/lib/hooks/useRecurring';
import { renderAccountIcon, formatCurrency } from '@/lib/utils';
import { SmoothSelect } from '@/components/ui/SmoothSelect';
import { FancyDateTimePicker } from '@/components/ui/FancyDateTimePicker';

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToPay?: any;
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

export function PayBillModal({ isOpen, onClose, ruleToPay }: PayBillModalProps) {
  const { payBill } = useRecurring();
  const { accounts } = useAccounts();

  const [mounted, setMounted] = useState(false);
  const [payAccountId, setPayAccountId] = useState('');
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
    if (ruleToPay) {
      const origAccId = ruleToPay.accountId || (typeof ruleToPay.account === 'object' ? ruleToPay.account?.id : '') || (accounts[0]?.id ?? '');
      setPayAccountId(origAccId);
      setNotes(`Paid bill for ${ruleToPay.title}`);
      setDateTime(toLocalISOString(new Date()));
    }
  }, [ruleToPay, isOpen, accounts]);

  if (!isOpen || !mounted || !ruleToPay) return null;

  const ruleTitle = ruleToPay.title || 'Bill';
  const amountVal = ruleToPay.rawAmount || Math.abs(parseFloat(ruleToPay.amount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAccountId) {
      setError('Please select a payment account');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const parsedDate = new Date(dateTime);
      const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

      await payBill(ruleToPay.id, {
        accountId: payAccountId,
        date: isoDate,
        notes: notes.trim(),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log bill payment');
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
            <CheckCircle2 size={20} className="text-[#10d88a]" />
            <h2 className="text-xl font-bold tracking-tight text-[#ffffff]">
              Pay Bill & Log Transaction
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

          {/* Rule Details Summary Card */}
          <div className="p-4 rounded-2xl border border-[#26263a] bg-[#10101a] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#8888a8] font-semibold uppercase tracking-wider">
              <span>Bill / Subscription</span>
              <span className="text-[#6c63ff] font-bold uppercase">{ruleToPay.frequency || 'Monthly'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#ffffff] flex items-center gap-1.5">
                💳 {ruleTitle}
              </span>
              <span className="text-2xl font-extrabold text-rose-400">
                {formatCurrency(amountVal)}
              </span>
            </div>
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Payment Account (Deduct Balance From)
            </label>
            <SmoothSelect
              value={payAccountId}
              onChange={(val) => setPayAccountId(val)}
              searchable
              placeholder="Select Account"
              options={accounts.map((acc: any) => ({
                value: acc.id,
                label: acc.name,
                icon: renderAccountIcon(acc.name, acc.type),
                description: `${acc.currency || 'INR'} • Current Balance: ${formatCurrency(acc.currentBalance ?? acc.balance ?? 0)}`,
              }))}
            />
          </div>

          {/* Date & Time Picker */}
          <FancyDateTimePicker
            value={dateTime}
            onChange={(val) => setDateTime(val)}
            label="Payment Date & Time"
          />

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0cc] mb-1.5">
              Payment Reference / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Enter reference number or payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] p-3 text-sm text-[#ffffff] focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all resize-y min-h-[70px] font-medium"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#10d88a] text-black shadow-lg shadow-[#10d88a]/25 hover:bg-[#34d399] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Processing...' : 'Confirm & Deduct Balance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
