'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  TrendingDown,
  Sparkles,
  Calendar,
  DollarSign,
  Zap,
  Snowflake,
  Trash2,
  Edit2,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { useDebts } from '@/lib/hooks/useDebts';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { formatCurrency } from '@/lib/utils';
import { AddDebtModal } from '@/components/modals/AddDebtModal';

export default function DebtPlannerPage() {
  const { formatPrivateCurrency } = usePrivacy();
  const { debtsData, isLoading, deleteDebt } = useDebts();

  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const debts = debtsData?.debts || [];
  const summary = debtsData?.summary || {};
  const currentSim = strategy === 'avalanche' ? debtsData?.avalanche : debtsData?.snowball;
  const otherSim = strategy === 'avalanche' ? debtsData?.snowball : debtsData?.avalanche;

  const interestSaved = useMemo(() => {
    const sInt = debtsData?.snowball?.totalInterestPaid || 0;
    const aInt = debtsData?.avalanche?.totalInterestPaid || 0;
    return Math.max(0, sInt - aInt);
  }, [debtsData]);

  const debtFreeDateFormatted = useMemo(() => {
    if (!currentSim?.payoffDate) return 'N/A';
    const d = new Date(currentSim.payoffDate);
    return isNaN(d.getTime())
      ? 'N/A'
      : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentSim]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the debt record for "${name}"?`)) {
      await deleteDebt(id);
    }
  };

  const handleEdit = (debt: any) => {
    setSelectedDebt(debt);
    setIsAddModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedDebt(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary tracking-tight">
              Debt Payoff & Amortization Planner
            </h1>
            <p className="text-xs font-medium text-text-muted">
              Accelerate debt freedom using Debt Avalanche (Highest Interest) or Debt Snowball (Lowest Balance)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-lg shadow-accent/30 hover:bg-accent-light hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Loan or Debt</span>
        </button>
      </div>

      {/* Strategy Toggle Bar */}
      <div className="card p-4 border border-border rounded-2xl bg-bg-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Payoff Strategy:
          </span>
          <div className="flex items-center gap-1.5 bg-bg-primary p-1.5 rounded-xl border border-border">
            <button
              onClick={() => setStrategy('avalanche')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'avalanche'
                  ? 'bg-warning text-text-primary shadow-md shadow-warning/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Zap size={14} />
              <span>Debt Avalanche (Highest APR First)</span>
            </button>

            <button
              onClick={() => setStrategy('snowball')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'snowball'
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Snowflake size={14} />
              <span>Debt Snowball (Lowest Balance First)</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-text-muted font-medium text-right">
          {strategy === 'avalanche' ? (
            <span>⚡ Minimizes total interest paid by targeting highest APR first.</span>
          ) : (
            <span>❄️ Maximizes motivation by eliminating smallest debts quickly.</span>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Debt Balance */}
        <div className="card p-5 border border-expense/30 rounded-2xl bg-bg-card space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-expense">
            Total Owed Debt
          </span>
          <div className="text-2xl font-bold text-expense">
            {formatPrivateCurrency(summary.totalBalance || 0)}
          </div>
          <div className="text-xs text-text-muted font-medium">
            Across {summary.count || 0} active debt rules
          </div>
        </div>

        {/* Estimated Debt-Free Target Date */}
        <div className="card p-5 border border-income/30 rounded-2xl bg-bg-card space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-income flex items-center gap-1">
            <Calendar size={14} /> Debt-Free Date
          </span>
          <div className="text-2xl font-bold text-income">
            {debtFreeDateFormatted}
          </div>
          <div className="text-xs text-text-muted font-medium">
            Payoff Timeline: {currentSim?.totalMonths || 0} Months
          </div>
        </div>

        {/* Total Interest Projection */}
        <div className="card p-5 border border-warning/30 rounded-2xl bg-bg-card space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-warning">
            Total Projected Interest
          </span>
          <div className="text-2xl font-bold text-warning">
            {formatPrivateCurrency(currentSim?.totalInterestPaid || 0)}
          </div>
          <div className="text-xs text-text-muted font-medium">
            {interestSaved > 0 && strategy === 'avalanche'
              ? `Save ₹${interestSaved.toLocaleString()} vs Snowball!`
              : 'Interest accrued over timeline'}
          </div>
        </div>

        {/* Monthly Payoff Commitment */}
        <div className="card p-5 border border-accent/30 rounded-2xl bg-bg-card space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Monthly Commitment
          </span>
          <div className="text-2xl font-bold text-text-primary">
            {formatPrivateCurrency(summary.totalMonthlyCommitment || 0)}
          </div>
          <div className="text-xs text-text-muted font-medium">
            Min: {formatPrivateCurrency(summary.totalMinPayment || 0)} • Extra: {formatPrivateCurrency(summary.totalExtraPayment || 0)}
          </div>
        </div>
      </div>

      {/* Debts Table */}
      <div className="card p-6 border border-border rounded-2xl bg-bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-text-primary">
            Configured Loans & Debts
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : debts.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm space-y-3">
            <Calculator size={36} className="mx-auto text-accent/40" />
            <p className="font-semibold">No loans or credit cards configured.</p>
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-accent/20 text-accent text-xs font-bold border border-accent/40 hover:bg-accent hover:text-white transition-all cursor-pointer inline-block"
            >
              + Add First Debt Item
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {debts.map((d: any) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-bg-primary hover:border-accent/40 transition-all gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base text-text-primary">
                      {d.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[11px] font-bold border border-accent/30">
                      {d.category || 'Credit Card'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap font-medium">
                    <span className="text-warning font-bold">
                      APR: {d.interestRate}%
                    </span>
                    <span>•</span>
                    <span>Min Pay: {formatPrivateCurrency(d.minimumPayment)}</span>
                    {d.extraPayment > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-income font-bold">
                          Extra Pay: +{formatPrivateCurrency(d.extraPayment)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-expense">
                      {formatPrivateCurrency(d.balance)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="p-2 rounded-xl border border-border bg-bg-hover text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                      title="Edit Debt"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.title)}
                      className="p-2 rounded-xl border border-border bg-bg-hover text-text-muted hover:text-expense hover:border-expense/40 transition-colors cursor-pointer"
                      title="Delete Debt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amortization Breakdown Table */}
      {currentSim?.schedule && currentSim.schedule.length > 0 && (
        <div className="card p-6 border border-border rounded-2xl bg-bg-card space-y-4">
          <h3 className="font-extrabold text-lg text-text-primary">
            Month-by-Month Amortization Schedule ({strategy.toUpperCase()})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="bg-bg-primary text-text-primary uppercase font-bold text-[11px] border-b border-border">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Monthly Payment</th>
                  <th className="p-3">Interest Charged</th>
                  <th className="p-3">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242436]">
                {currentSim.schedule.map((row: any) => (
                  <tr key={row.month} className="hover:bg-bg-secondary transition-colors">
                    <td className="p-3 font-bold text-text-primary">Month {row.month}</td>
                    <td className="p-3 font-semibold text-income">{formatPrivateCurrency(row.totalPaid)}</td>
                    <td className="p-3 font-semibold text-expense">{formatPrivateCurrency(row.interestPaid)}</td>
                    <td className="p-3 font-bold text-text-primary">{formatPrivateCurrency(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddDebtModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDebt(null);
        }}
        debtToEdit={selectedDebt}
      />
    </div>
  );
}
