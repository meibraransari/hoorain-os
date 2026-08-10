'use client';

import { useState } from 'react';
import { useGoals, useAccounts } from '@/lib/hooks/useFinance';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { Plus, Target, Trash2, Edit2, PiggyBank, CheckCircle2, TrendingDown, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function GoalsPage() {
  const { goals, isLoading, contributeGoal, deleteGoal } = useGoals();
  const { accounts } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<any>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const handleEdit = (goal: any) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this financial goal?')) {
      await deleteGoal(id);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contributeGoalId && contributeAmount && parseFloat(contributeAmount) > 0) {
      await contributeGoal(contributeGoalId, parseFloat(contributeAmount));
      setContributeGoalId(null);
      setContributeAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Financial Goals</h1>
          <p className="text-text-secondary mt-1">Manage savings targets (income goals) and expense budget limits linked to your accounts.</p>
        </div>
        <button
          onClick={() => {
            setGoalToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
        >
          <Plus size={18} />
          <span>New Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 rounded-xl skeleton" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center text-text-muted space-y-3 border border-dashed border-border rounded-xl">
          <Target size={48} className="mx-auto text-text-muted/50" />
          <p className="text-lg font-medium text-text-primary">No financial goals created yet</p>
          <p className="text-sm text-text-muted">Click "New Goal" to set up income savings targets or expense budget limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal: any) => {
            const target = parseFloat(goal.targetAmount) || 1;
            const current = parseFloat(goal.currentAmount) || 0;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isDone = current >= target;
            const isExpenseType = goal.type === 'expense';
            const linkedAcc = accounts.find((a: any) => a.id === goal.accountId);

            return (
              <div key={goal.id} className="card border border-border p-6 rounded-xl relative group flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      isDone
                        ? 'bg-income/15 text-income'
                        : isExpenseType
                        ? 'bg-expense/15 text-expense'
                        : 'bg-accent/15 text-accent'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 size={24} />
                      ) : isExpenseType ? (
                        <TrendingDown size={24} />
                      ) : (
                        <PiggyBank size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-text-primary">{goal.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isExpenseType
                            ? 'bg-expense/15 text-expense border border-expense/20'
                            : 'bg-income/15 text-income border border-income/20'
                        }`}>
                          {isExpenseType ? 'Expense Goal' : 'Savings Goal'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        {linkedAcc && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-accent" />
                            <span>{linkedAcc.name}</span>
                            <span>•</span>
                          </span>
                        )}
                        {goal.deadline && (
                          <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="text-text-muted hover:text-accent p-1 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-text-muted hover:text-expense p-1 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-muted font-medium">Progress ({pct}%)</span>
                    <span className="font-bold text-text-primary">
                      {formatCurrency(current)} / {formatCurrency(target)}
                    </span>
                  </div>
                  <div className="w-full bg-bg-hover h-3 rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-income'
                          : isExpenseType
                          ? 'bg-expense'
                          : 'bg-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <button
                    onClick={() => setContributeGoalId(goal.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-light transition-colors"
                  >
                    <Plus size={14} />
                    <span>{isExpenseType ? 'Add Expense Contribution' : 'Add Savings Contribution'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contribution Modal */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm bg-bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-text-primary">Add Contribution</h3>
            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Contribution Amount</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoalId(null)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent-light"
                >
                  Add Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}
