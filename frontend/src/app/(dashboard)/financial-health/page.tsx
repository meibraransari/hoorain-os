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
  const ratingColor = insightsData?.ratingColor ?? 'text-[#8888a8]';
  const metrics = insightsData?.metrics || {};
  const insights = insightsData?.insights || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6c63ff]/15 text-[#6c63ff] border border-[#6c63ff]/30">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-[#ffffff] tracking-tight">
              AI Financial Health & Insights
            </h1>
            <p className="text-xs font-medium text-[#8888a8]">
              Dynamic financial health rating, ratio analysis, and automated spending recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => refreshInsights()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2b2b40] bg-[#141420] text-xs font-bold text-[#ffffff] hover:bg-[#1a1a28] transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Hero Score Banner */}
      <div className="card relative overflow-hidden p-8 border border-[#6c63ff]/30 rounded-3xl bg-gradient-to-r from-[#141424] via-[#1a1a32] to-[#141424] shadow-2xl before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-[#6c63ff] before:via-teal-400 before:to-[#6c63ff]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6c63ff] bg-[#6c63ff]/15 px-3 py-1 rounded-full border border-[#6c63ff]/30 inline-block">
              AI Health Rating Engine
            </span>
            <h2 className="text-3xl font-extrabold text-[#ffffff]">
              Your Financial Health is <span className={ratingColor}>{ratingLabel}</span>
            </h2>
            <p className="text-sm text-[#8888a8] max-w-xl font-medium">
              Based on liquid emergency reserves, debt-to-income ratio, monthly savings rate benchmark, and budget adherence.
            </p>
          </div>

          <div className="flex items-center justify-center h-32 w-32 rounded-full border-4 border-[#6c63ff]/40 bg-[#10101a] shadow-2xl relative shrink-0">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-[#ffffff] block leading-none">
                {healthScore}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8888a8]">
                Out of 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Ratio Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Emergency Fund */}
        <div className="card p-5 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8] flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-teal-400" /> Emergency Coverage
            </span>
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-md border border-teal-400/20">
              {metrics.emergencyScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-[#ffffff]">
              {metrics.emergencyMonths || 0} Months
            </div>
            <div className="text-xs text-[#8888a8] font-medium mt-0.5">
              Liquid Fund: {formatPrivateCurrency(metrics.liquidSavings || 0)}
            </div>
          </div>

          <div className="w-full bg-[#10101a] h-2 rounded-full overflow-hidden border border-[#26263a]">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.emergencyMonths || 0) / 6) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-[#8888a8] block">Target: 3 to 6 months expenses</span>
        </div>

        {/* Metric 2: DTI Ratio */}
        <div className="card p-5 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8] flex items-center gap-1.5">
              <Percent size={16} className="text-amber-400" /> Debt-to-Income (DTI)
            </span>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              {metrics.dtiScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-[#ffffff]">
              {metrics.dtiRatio || 0}%
            </div>
            <div className="text-xs text-[#8888a8] font-medium mt-0.5">
              Monthly Debt: {formatPrivateCurrency(metrics.monthlyDebtPayments || 0)}
            </div>
          </div>

          <div className="w-full bg-[#10101a] h-2 rounded-full overflow-hidden border border-[#26263a]">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.dtiRatio || 0) / 50) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-[#8888a8] block">Target: Under 36% of income</span>
        </div>

        {/* Metric 3: Savings Rate */}
        <div className="card p-5 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8] flex items-center gap-1.5">
              <TrendingUp size={16} className="text-emerald-400" /> Savings Rate
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
              {metrics.savingsScore} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-[#ffffff]">
              {metrics.savingsRate || 0}%
            </div>
            <div className="text-xs text-[#8888a8] font-medium mt-0.5">
              Income: {formatPrivateCurrency(metrics.currentMonthIncome || 0)}
            </div>
          </div>

          <div className="w-full bg-[#10101a] h-2 rounded-full overflow-hidden border border-[#26263a]">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics.savingsRate || 0) / 30) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-[#8888a8] block">Target: Minimum 20% savings</span>
        </div>

        {/* Metric 4: Budget Adherence */}
        <div className="card p-5 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8] flex items-center gap-1.5">
              <PieChart size={16} className="text-[#6c63ff]" /> Budget Control
            </span>
            <span className="text-xs font-bold text-[#6c63ff] bg-[#6c63ff]/10 px-2 py-0.5 rounded-md border border-[#6c63ff]/20">
              {metrics.budgetScore ?? 0} / 25 pts
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-[#ffffff]">
              {Math.round(((metrics.budgetScore ?? 0) / 25) * 100)}%
            </div>
            <div className="text-xs text-[#8888a8] font-medium mt-0.5">
              Monthly Budget Adherence
            </div>
          </div>

          <div className="w-full bg-[#10101a] h-2 rounded-full overflow-hidden border border-[#26263a]">
            <div
              className="bg-[#6c63ff] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((metrics.budgetScore ?? 0) / 25) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-[#8888a8] block">Target: 100% budgets within limit</span>
        </div>
      </div>

      {/* Automated Smart Spending Insights List */}
      <div className="card p-6 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#ffffff] flex items-center gap-2">
            <Sparkles size={20} className="text-[#6c63ff]" />
            <span>Automated Smart Spending Insights</span>
          </h3>
          <span className="text-xs font-bold text-[#6c63ff] bg-[#6c63ff]/15 px-2.5 py-0.5 rounded-full border border-[#6c63ff]/30">
            {insights.length} Insights Detected
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 text-center text-[#8888a8] text-sm">
            No spending anomalies detected. Keep logging transactions to receive intelligent financial advice.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs font-medium space-y-1.5 transition-all ${
                  item.type === 'warning'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    : item.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-[#6c63ff]/30 bg-[#6c63ff]/10 text-[#ffffff]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'warning' ? (
                    <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  ) : item.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Info size={16} className="text-[#6c63ff] shrink-0" />
                  )}
                  <span className="font-bold text-sm text-[#ffffff]">{item.title}</span>
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
