'use client';

import { useGoals } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { Target, TrendingUp, Clock } from 'lucide-react';

export function GoalVelocityTracker() {
  const { formatPrivateCurrency, formatPrivateNumber } = usePrivacy();
  const { goals, isLoading } = useGoals();

  if (isLoading) return <div className="h-44 rounded-2xl skeleton" />;

  const activeGoals = goals.filter((g: any) => g.status !== 'completed' && parseFloat(g.targetAmount) > 0);

  if (activeGoals.length === 0) {
    return (
      <CollapsibleCard title="Goal Velocity Tracker">
        <div className="p-4 text-center text-xs text-text-muted">
          No active goals to track.
        </div>
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard title="Active Goal Velocity">
      <div className="space-y-4 mt-2">
        {activeGoals.map((goal: any) => {
          const target = parseFloat(goal.targetAmount) || 1;
          const saved = parseFloat(goal.currentAmount) || 0;
          const percent = Math.min(100, Math.max(0, (saved / target) * 100));
          
          return (
            <div key={goal.id} className="p-3 rounded-xl border border-border bg-bg-card hover:border-accent/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <Target size={14} />
                  </div>
                  <span className="text-xs font-bold text-text-primary">{goal.name}</span>
                </div>
                <span className="text-xs font-extrabold text-accent">{formatPrivateNumber(percent, '%')}</span>
              </div>
              
              <div className="w-full bg-bg-secondary rounded-full h-2 mb-2 overflow-hidden">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-semibold text-text-muted">
                <span>{formatPrivateCurrency(saved)} saved</span>
                <span>{formatPrivateCurrency(target)} target</span>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
}
