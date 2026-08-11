'use client';

import { useProfitLoss } from '@/lib/hooks/useFinance';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, ArrowDownRight, BarChart2, Award } from 'lucide-react';

export function ExecutiveProfitLossWidget() {
  const { profitLoss, isLoading } = useProfitLoss();
  const { formatPrivateCurrency } = usePrivacy();

  if (isLoading || !profitLoss) {
    return <div className="card p-6 h-56 skeleton rounded-2xl" />;
  }

  const {
    grossRevenue = 0,
    operatingExpenses = 0,
    netOperatingProfit = 0,
    netMarginPercentage = 0,
    momRevenueGrowth = 0,
    momExpenseGrowth = 0,
    momProfitGrowth = 0,
  } = profitLoss;

  const isProfitPositive = netOperatingProfit >= 0;

  return (
    <div className="card p-6 border border-accent/25 bg-bg-card rounded-2xl space-y-5 shadow-xl hover:border-accent/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30">
            <BarChart2 size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-text-primary tracking-tight">
              Executive Profit & Loss (P&L) Summary
            </h3>
            <p className="text-xs text-text-muted">Real-time monthly revenue, expense velocity, and margin</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 border ${
            isProfitPositive
              ? 'bg-income/15 text-income border-income/30'
              : 'bg-expense/15 text-expense border-expense/30'
          }`}
        >
          {isProfitPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>Net Margin: {netMarginPercentage}%</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gross Revenue */}
        <div className="p-4 rounded-xl bg-income/5 border border-income/20 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-income">
            <span>Gross Revenue</span>
            <span className="flex items-center text-[11px]">
              {momRevenueGrowth >= 0 ? '+' : ''}{momRevenueGrowth}% MoM
            </span>
          </div>
          <div className="text-xl font-extrabold text-text-primary">
            {formatPrivateCurrency(grossRevenue)}
          </div>
          <p className="text-[11px] text-text-muted">Total income inflow</p>
        </div>

        {/* Operating Expenses */}
        <div className="p-4 rounded-xl bg-expense/5 border border-expense/20 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-expense">
            <span>Operating Expenses</span>
            <span className="flex items-center text-[11px]">
              {momExpenseGrowth >= 0 ? '+' : ''}{momExpenseGrowth}% MoM
            </span>
          </div>
          <div className="text-xl font-extrabold text-text-primary">
            {formatPrivateCurrency(operatingExpenses)}
          </div>
          <p className="text-[11px] text-text-muted">Total category outflows</p>
        </div>

        {/* Net Operating Profit */}
        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isProfitPositive
              ? 'bg-accent/10 border-accent/30'
              : 'bg-expense/10 border-expense/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase text-accent">
            <span>Net Operating Profit</span>
            <span className="flex items-center text-[11px]">
              {momProfitGrowth >= 0 ? '+' : ''}{momProfitGrowth}% MoM
            </span>
          </div>
          <div
            className={`text-xl font-extrabold ${
              isProfitPositive ? 'text-income' : 'text-expense'
            }`}
          >
            {formatPrivateCurrency(netOperatingProfit)}
          </div>
          <p className="text-[11px] text-text-muted">Revenue minus expenses</p>
        </div>
      </div>
    </div>
  );
}
