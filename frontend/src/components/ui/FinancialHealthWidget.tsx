'use client';

import { useInsights } from '@/lib/hooks/useInsights';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { BrainCircuit, Sparkles, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function FinancialHealthWidget() {
  const { formatPrivateCurrency } = usePrivacy();
  const { insightsData, isLoading } = useInsights();

  if (isLoading) {
    return <div className="h-44 rounded-2xl skeleton" />;
  }

  const healthScore = insightsData?.healthScore ?? 0;
  const ratingLabel = insightsData?.ratingLabel ?? (healthScore > 0 ? 'Good' : 'No Data');
  const ratingColor = insightsData?.ratingColor ?? 'text-text-muted';
  const metrics = insightsData?.metrics || {};
  const topInsights = (insightsData?.insights || []).slice(0, 2);

  return (
    <CollapsibleCard
      title="AI Financial Health Score"
      action={
        <Link
          href="/financial-health"
          className="text-xs font-semibold text-[#6c63ff] hover:underline flex items-center gap-1"
        >
          <span>View Insights</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Score Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[#2b2b40] bg-[#10101a]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6c63ff]/15 text-[#6c63ff] border border-[#6c63ff]/30">
              <BrainCircuit size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">
                Overall Health Index
              </div>
              <div className={`text-lg font-extrabold ${ratingColor}`}>
                {ratingLabel} ({healthScore} / 100)
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-display font-extrabold text-[#ffffff]">
              {healthScore}
            </div>
            <div className="text-[10px] font-bold uppercase text-[#8888a8]">
              Score
            </div>
          </div>
        </div>

        {/* Quick Metric Bars */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl border border-[#26263a] bg-[#141422] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8888a8] block">Emergency Buffer</span>
            <span className="font-extrabold text-[#ffffff]">{metrics.emergencyMonths || 0} Months</span>
          </div>

          <div className="p-2.5 rounded-xl border border-[#26263a] bg-[#141422] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8888a8] block">Savings Rate</span>
            <span className="font-extrabold text-[#ffffff]">{metrics.savingsRate || 0}%</span>
          </div>
        </div>

        {/* Top Insights Preview */}
        {topInsights.length > 0 && (
          <div className="space-y-2 pt-1">
            {topInsights.map((insight: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                  insight.type === 'warning'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : insight.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-[#6c63ff]/30 bg-[#6c63ff]/10 text-[#ffffff]'
                }`}
              >
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">{insight.title}</span>
                  <span className="opacity-90">{insight.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
