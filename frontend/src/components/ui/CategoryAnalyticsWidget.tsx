'use client';

import { useMemo } from 'react';
import { useTransactions } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { PieChart as PieChartIcon } from 'lucide-react';

export function CategoryAnalyticsWidget() {
  const { formatPrivateCurrency } = usePrivacy();
  const { transactions } = useTransactions({ limit: 2000 });

  const categoryBreakdown = useMemo(() => {
    const expenses = transactions.filter((t: any) => !t.isTransfer && (t.type === 'expense' || t.income === 0));
    const totalExp = expenses.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || 0)), 0);

    const stats: Record<string, number> = {};
    expenses.forEach((t: any) => {
      const catName = typeof t.category === 'string' ? t.category : t.category?.name || 'General';
      const amt = Math.abs(parseFloat(t.amount || 0));
      stats[catName] = (stats[catName] || 0) + amt;
    });

    const colors = ['#6c63ff', '#ffb84d', '#10d88a', '#ff4d6d', '#00f2fe', '#f39c12', '#9b59b6'];

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], idx) => ({
        name,
        amount,
        percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        color: colors[idx % colors.length],
      }));
  }, [transactions]);

  if (categoryBreakdown.length === 0) return null;

  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-2">
          <PieChartIcon size={16} className="text-accent" />
          <span className="font-bold text-base text-text-primary">Top Category Breakdown</span>
        </div>
      }
      subtitle="Spending distribution across main categories"
    >
      <div className="space-y-3 pt-1">
        {categoryBreakdown.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </span>
              <span className="text-text-muted font-mono">
                {formatPrivateCurrency(item.amount)} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}
