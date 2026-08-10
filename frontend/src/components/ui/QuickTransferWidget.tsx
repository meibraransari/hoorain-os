'use client';

import { useState } from 'react';
import { ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { useAccounts, useTransactions } from '@/lib/hooks/useFinance';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';

export function QuickTransferWidget() {
  const { accounts } = useAccounts();
  const { createTransaction } = useTransactions();

  const [fromAcc, setFromAcc] = useState('');
  const [toAcc, setToAcc] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    const sourceAcc = fromAcc || accounts[0]?.id;
    const destAcc = toAcc || (accounts.length > 1 ? accounts[1]?.id : '');

    if (!sourceAcc || !destAcc || sourceAcc === destAcc) {
      setError('Please select two different accounts for transfer.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await createTransaction({
        title: 'Quick Dashboard Transfer',
        amount: parseFloat(amount),
        type: 'transfer',
        accountId: sourceAcc,
        targetAccountId: destAcc,
        date: new Date().toISOString(),
      });
      setSuccess(true);
      setAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length < 2) return null;

  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="font-bold text-base text-text-primary">Quick Fund Transfer</span>
        </div>
      }
      subtitle="Instant account-to-account balance transfer"
    >
      <form onSubmit={handleTransfer} className="space-y-3 pt-1">
        {error && <div className="p-2 text-xs rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}
        {success && (
          <div className="p-2 text-xs rounded-lg bg-income/10 text-income border border-income/20 flex items-center gap-1.5 font-bold">
            <Check size={14} />
            <span>Transfer completed successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase font-semibold text-text-muted block mb-1">From</label>
            <select
              value={fromAcc || (accounts[0]?.id ?? '')}
              onChange={(e) => setFromAcc(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover p-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id} className="bg-bg-card text-text-primary">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-text-muted block mb-1">To</label>
            <select
              value={toAcc || (accounts[1]?.id ?? '')}
              onChange={(e) => setToAcc(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover p-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id} className="bg-bg-card text-text-primary">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-semibold text-text-muted block mb-1">Transfer Amount</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-3 py-2 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-accent text-white text-xs font-bold shadow-md hover:bg-accent-light transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowRightLeft size={14} />
          <span>{loading ? 'Executing Transfer...' : 'Execute Instant Transfer'}</span>
        </button>
      </form>
    </CollapsibleCard>
  );
}
