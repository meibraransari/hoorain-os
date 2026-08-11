'use client';

import { useCreditUtilization } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CreditCard, ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

export function CreditUtilizationWidget() {
  const { creditUtilization, isLoading } = useCreditUtilization();
  const { formatPrivateCurrency } = usePrivacy();

  if (isLoading || !creditUtilization) {
    return <div className="card p-6 h-56 skeleton rounded-2xl" />;
  }

  const {
    totalCreditLimit = 0,
    totalCreditUsed = 0,
    overallUtilizationPercentage = 0,
    overallSafetyStatus = 'ideal',
    perCardBreakdown = [],
  } = creditUtilization;

  const getStatusBadge = (status: string, pct: number) => {
    if (status === 'danger' || pct > 70) {
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-expense/15 text-expense border border-expense/30 flex items-center gap-1">
          <ShieldAlert size={13} />
          <span>High Risk ({pct}%)</span>
        </span>
      );
    }
    if (status === 'warning' || pct >= 30) {
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <AlertTriangle size={13} />
          <span>Moderate ({pct}%)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-income/15 text-income border border-income/30 flex items-center gap-1">
        <ShieldCheck size={13} />
        <span>Ideal (&lt;30%)</span>
      </span>
    );
  };

  return (
    <div className="card p-6 border border-accent/25 bg-bg-card rounded-2xl space-y-5 shadow-xl hover:border-accent/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-text-primary tracking-tight">
              Credit Utilization & Debt Safety Gauge
            </h3>
            <p className="text-xs text-text-muted">Aggregate credit card limit vs current balance</p>
          </div>
        </div>
        <div>{getStatusBadge(overallSafetyStatus, overallUtilizationPercentage)}</div>
      </div>

      {/* Aggregate Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>Used: <strong className="text-expense">{formatPrivateCurrency(totalCreditUsed)}</strong></span>
          <span>Limit: <strong className="text-text-primary">{formatPrivateCurrency(totalCreditLimit)}</strong></span>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-bg-hover h-3 rounded-full overflow-hidden border border-border relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallUtilizationPercentage > 70
                ? 'bg-expense'
                : overallUtilizationPercentage >= 30
                ? 'bg-amber-400'
                : 'bg-income'
            }`}
            style={{ width: `${Math.min(100, overallUtilizationPercentage)}%` }}
          />
        </div>
      </div>

      {/* Per-Card Breakdown */}
      {perCardBreakdown.length > 0 && (
        <div className="space-y-3.5 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Card / Debt Accounts ({perCardBreakdown.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {perCardBreakdown.map((card: any) => (
              <div
                key={card.id}
                className="p-3.5 rounded-xl border border-border bg-bg-hover/60 space-y-2 hover:border-accent/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary text-xs truncate">{card.name}</span>
                  {getStatusBadge(card.safetyBadge, card.utilizationPercentage)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Balance: <strong className="text-expense">{formatPrivateCurrency(card.currentBalance)}</strong></span>
                  <span>Limit: <strong className="text-text-primary">{formatPrivateCurrency(card.creditLimit)}</strong></span>
                </div>
                <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden border border-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      card.utilizationPercentage > 70
                        ? 'bg-expense'
                        : card.utilizationPercentage >= 30
                        ? 'bg-amber-400'
                        : 'bg-income'
                    }`}
                    style={{ width: `${Math.min(100, card.utilizationPercentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
