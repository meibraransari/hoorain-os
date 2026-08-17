'use client';

import { useMemo } from 'react';
import { useTransactions, useAccounts } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { PlaneTakeoff, ShieldCheck, AlertTriangle } from 'lucide-react';

export function SavingsRateRunwayWidget() {
  const { formatPrivateCurrency } = usePrivacy();
  const { transactions, isLoading: txLoading } = useTransactions({ limit: 10000 });
  const { accounts, isLoading: accLoading } = useAccounts();

  const { runwayMonths, liquidAssets, avgMonthlyExpense } = useMemo(() => {
    if (txLoading || accLoading) return { runwayMonths: 0, liquidAssets: 0, avgMonthlyExpense: 0 };

    // Calculate Liquid Assets
    const liquidTypes = ['checking', 'savings', 'cash', 'wallet', 'crypto'];
    const liquid = accounts
      .filter((acc: any) => {
        const typeStr = (typeof acc.type === 'object' ? acc.type?.code : acc.type || '').toLowerCase();
        return liquidTypes.some((t) => typeStr.includes(t)) && acc.includeInNetWorth !== false;
      })
      .reduce((sum: number, acc: any) => sum + Math.max(0, parseFloat(acc.currentBalance || acc.balance) || 0), 0);

    // Calculate Average Monthly Expense (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    let totalExpense = 0;
    transactions.forEach((tx: any) => {
      if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
      const txDate = new Date(tx.date);
      if (txDate >= threeMonthsAgo && txDate <= now && (tx.type === 'expense' || tx.income === 0)) {
        totalExpense += Math.abs(parseFloat(tx.amount) || 0);
      }
    });

    const avgExpense = totalExpense / 3 || 1; // avoid division by zero
    const runway = liquid / avgExpense;

    return { runwayMonths: runway, liquidAssets: liquid, avgMonthlyExpense: avgExpense };
  }, [transactions, accounts, txLoading, accLoading]);

  const getRunwayColor = () => {
    if (runwayMonths >= 6) return 'text-income';
    if (runwayMonths >= 3) return 'text-accent';
    return 'text-expense';
  };

  const Icon = runwayMonths >= 6 ? ShieldCheck : runwayMonths >= 3 ? PlaneTakeoff : AlertTriangle;

  if (txLoading || accLoading) return <div className="h-44 rounded-2xl skeleton" />;

  return (
    <CollapsibleCard title="Financial Runway">
      <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-bg-card">
        <div className={`p-4 rounded-xl bg-bg-secondary ${getRunwayColor()}`}>
          <Icon size={32} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-muted mb-1">Estimated runway if income drops to zero</p>
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-black ${getRunwayColor()}`}>
              {runwayMonths > 99 ? '99+' : runwayMonths.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-text-muted pb-1">Months</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 bg-bg-secondary/50 rounded-xl">
          <p className="text-xs text-text-muted">Liquid Assets</p>
          <p className="font-bold text-text-primary">{formatPrivateCurrency(liquidAssets)}</p>
        </div>
        <div className="p-3 bg-bg-secondary/50 rounded-xl">
          <p className="text-xs text-text-muted">Avg Monthly Burn</p>
          <p className="font-bold text-text-primary">{formatPrivateCurrency(avgMonthlyExpense)}</p>
        </div>
      </div>
    </CollapsibleCard>
  );
}
