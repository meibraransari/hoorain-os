'use client';

import { useState } from 'react';
import { useBudgets } from '@/lib/hooks/useFinance';
import { BudgetCard } from '@/components/ui/BudgetCard';
import { AddBudgetModal } from '@/components/modals/AddBudgetModal';
import { Plus, PieChart as PieIcon } from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, isLoading, deleteBudget } = useBudgets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<any>(null);

  const handleEdit = (budget: any) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Budgets</h1>
          <p className="text-text-secondary mt-1">Set category spending limits, track expenses, and monitor monthly budget caps.</p>
        </div>
        <button
          onClick={() => {
            setBudgetToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
        >
          <Plus size={18} />
          <span>Add Budget</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl skeleton" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card p-12 text-center text-text-muted space-y-3 border border-dashed border-border rounded-xl">
          <PieIcon size={48} className="mx-auto text-text-muted/50" />
          <p className="text-lg font-medium text-text-primary">No budget limits configured</p>
          <p className="text-sm text-text-muted">Click "Add Budget" to start tracking category spending caps.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b: any) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />
    </div>
  );
}
