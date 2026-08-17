'use client';

import { useMemo } from 'react';
import { useTransactions } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { BarChart3 } from 'lucide-react';

export function WeeklySpendingHeatmap() {
  const { formatPrivateCurrency } = usePrivacy();
  const { transactions, isLoading } = useTransactions({ limit: 10000 });

  const { maxSpend, days } = useMemo(() => {
    if (isLoading) return { maxSpend: 0, days: [] };

    // Initialize days of week (0=Sun, 1=Mon, ..., 6=Sat)
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Only count expenses from the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    transactions.forEach((tx: any) => {
      if (tx.isTransfer || tx.excludeFromBalance || !tx.date) return;
      const txDate = new Date(tx.date);
      if (txDate >= thirtyDaysAgo && txDate <= now && (tx.type === 'expense' || tx.income === 0)) {
        const dayIdx = txDate.getDay();
        dayTotals[dayIdx] += Math.abs(parseFloat(tx.amount) || 0);
      }
    });

    const max = Math.max(...dayTotals, 1);
    
    // Shift array to start on Monday instead of Sunday for better UI UX
    const shiftedTotals = [...dayTotals.slice(1), dayTotals[0]];
    const shiftedLabels = [...dayLabels.slice(1), dayLabels[0]];

    const mappedDays = shiftedLabels.map((lbl, idx) => ({
      label: lbl,
      total: shiftedTotals[idx],
      percent: (shiftedTotals[idx] / max) * 100,
    }));

    return { maxSpend: max, days: mappedDays };
  }, [transactions, isLoading]);

  if (isLoading) return <div className="h-44 rounded-2xl skeleton" />;

  return (
    <CollapsibleCard title="Weekly Spending Velocity (Last 30 Days)">
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-end justify-between gap-2 h-32 px-2">
          {days.map((day) => (
            <div key={day.label} className="flex flex-col items-center gap-2 flex-1 group">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-accent whitespace-nowrap -translate-y-2">
                {formatPrivateCurrency(day.total)}
              </div>
              
              {/* Bar */}
              <div className="w-full max-w-[2rem] bg-bg-secondary rounded-t-lg relative flex justify-end flex-col h-full overflow-hidden">
                <div 
                  className="w-full bg-expense/80 group-hover:bg-expense transition-all duration-500 rounded-t-lg"
                  style={{ height: `${day.percent}%` }}
                />
              </div>
              
              {/* Label */}
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  );
}
