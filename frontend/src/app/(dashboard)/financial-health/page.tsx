'use client';

import { useInsights } from '@/lib/hooks/useInsights';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Percent,
  RefreshCw,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function FinancialHealthPage() {
  const { formatPrivateCurrency } = usePrivacy();
  const { insightsData, isLoading, refreshInsights } = useInsights();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const healthScore = insightsData?.healthScore ?? 0;
  const ratingLabel = insightsData?.ratingLabel ?? (healthScore > 0 ? 'Good' : 'No Financial Data');
  const ratingColor = insightsData?.ratingColor ?? 'text-text-muted';
  const metrics = insightsData?.metrics || {};
  const insights = insightsData?.insights || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary tracking-tight">
              AI Financial Health & Insights
            </h1>
            <p className="text-xs font-medium text-text-muted">
              Dynamic financial health rating, ratio analysis, and automated spending recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => refreshInsights()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-card text-xs font-bold text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Hero Score Banner */}
      <div className="card relative overflow-hidden p-8 border border-accent/30 rounded-3xl bg-gradient-to-r from-[#141424] via-[#1a1a32] to-[#141424] shadow-2xl before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-[#6c63ff] before:via-teal-400 before:to-[#6c63ff]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/15 px-3 py-1 rounded-full border border-accent/30 inline-block">
              AI Health Rating Engine
            </span>
            <h2 className="text-3xl font-extrabold text-text-primary">
              Your Financial Health is <span className={ratingColor}>{ratingLabel}</span>
            </h2>
            <p className="text-sm text-text-muted max-w-xl font-medium">
              Based on liquid emergency reserves, debt-to-income ratio, monthly savings rate benchmark, and budget adherence.
            </p>
          </div>

          <div className="flex items-center justify-center h-32 w-32 rounded-full border-4 border-accent/40 bg-bg-primary shadow-2xl relative shrink-0">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-text-primary block leading-none">
                {healthScore}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                Out of 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Ratio Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Emergency Fund */}
        <div className="card p-5 border border-border rounded-2xl bg-bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-info" /> Emergency Coverage
            </span>
            <span className="text-xs font-bold text-info bg-info/10 px-2 py-0.5 rounded-md border border-teal-400/20">
              {metrics.emergencyScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-text-primary">
              {metrics.emergencyMonths || 0} Months
            </div>
            <div className="text-xs text-text-muted font-medium mt-0.5">
              Liquid Fund: {formatPrivateCurrency(metrics.liquidSavings || 0)}
            </div>
          </div>

          <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-info h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.emergencyMonths || 0) / 6) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-text-muted block">Target: 3 to 6 months expenses</span>
        </div>

        {/* Metric 2: DTI Ratio */}
        <div className="card p-5 border border-border rounded-2xl bg-bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Percent size={16} className="text-warning" /> Debt-to-Income (DTI)
            </span>
            <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              {metrics.dtiScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-text-primary">
              {metrics.dtiRatio || 0}%
            </div>
            <div className="text-xs text-text-muted font-medium mt-0.5">
              Monthly Debt: {formatPrivateCurrency(metrics.monthlyDebtPayments || 0)}
            </div>
          </div>

          <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-warning h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.dtiRatio || 0) / 50) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-text-muted block">Target: Under 36% of income</span>
        </div>

        {/* Metric 3: Savings Rate */}
        <div className="card p-5 border border-border rounded-2xl bg-bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <TrendingUp size={16} className="text-income" /> Savings Rate
            </span>
            <span className="text-xs font-bold text-income bg-income/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
              {metrics.savingsScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-text-primary">
              {metrics.savingsRate || 0}%
            </div>
            <div className="text-xs text-text-muted font-medium mt-0.5">
              Income: {formatPrivateCurrency(metrics.currentMonthIncome || 0)}
            </div>
          </div>

          <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-income h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.savingsRate || 0) / 30) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-text-muted block">Target: Minimum 20% savings</span>
        </div>

        {/* Metric 4: Budget Adherence */}
        <div className="card p-5 border border-border rounded-2xl bg-bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <PieChart size={16} className="text-accent" /> Budget Control
            </span>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
              {metrics.budgetScore ?? 0} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-text-primary">
              {Math.round(((metrics.budgetScore ?? 0) / 25) * 100)}%
            </div>
            <div className="text-xs text-text-muted font-medium mt-0.5">
              Monthly Budget Adherence
            </div>
          </div>

          <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((metrics.budgetScore ?? 0) / 25) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-text-muted block">Target: 100% budgets within limit</span>
        </div>
      </div>

      {/* Automated Smart Spending Insights List */}
      <div className="card p-6 border border-border rounded-2xl bg-bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-text-primary flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            <span>Automated Smart Spending Insights</span>
          </h3>
          <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded-full border border-accent/30">
            {insights.length} Insights Detected
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No spending anomalies detected. Keep logging transactions to receive intelligent financial advice.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs font-medium space-y-1.5 transition-all ${
                  item.type === 'warning'
                    ? 'border-expense/30 bg-expense/10 text-expense'
                    : item.type === 'success'
                    ? 'border-income/30 bg-income/10 text-income'
                    : 'border-accent/30 bg-accent/10 text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'warning' ? (
                    <AlertTriangle size={16} className="text-expense shrink-0" />
                  ) : item.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-income shrink-0" />
                  ) : (
                    <Info size={16} className="text-accent shrink-0" />
                  )}
                  <span className="font-bold text-sm text-text-primary">{item.title}</span>
                </div>
                <p className="opacity-90 leading-relaxed font-normal">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
