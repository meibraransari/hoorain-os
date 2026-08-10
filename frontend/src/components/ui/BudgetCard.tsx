import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';

interface BudgetCardProps {
  budget: any;
  onEdit?: (budget: any) => void;
  onDelete?: (id: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  if (!budget) return null;

  const limit = parseFloat(budget.amount || budget.limit) || 1;
  const spent = parseFloat(budget.spentAmount || budget.spent || budget.currentAmount) || 0;
  const percentage = Math.min(Math.round((spent / limit) * 100), 100);
  const remaining = limit - spent;
  
  let statusColor = 'bg-income/15 text-income border-income/20';
  let barColor = 'bg-income';
  if (percentage >= 90 || spent > limit) {
    statusColor = 'bg-expense/15 text-expense border-expense/20';
    barColor = 'bg-expense';
  } else if (percentage >= 75) {
    statusColor = 'bg-warning/15 text-warning border-warning/20';
    barColor = 'bg-warning';
  }

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5 hover:bg-bg-hover transition-all shadow-sm hover:shadow-md space-y-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg text-text-primary truncate">{budget.name || 'Budget'}</h4>
          <span className="text-xs text-text-muted capitalize">Period: {budget.period || 'monthly'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold border ${statusColor}`}>
            {percentage}% Spent
          </span>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border shadow-sm">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(budget);
                  }}
                  className="p-1 text-text-muted hover:text-accent transition-colors"
                  title="Edit Budget"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(budget.id);
                  }}
                  className="p-1 text-text-muted hover:text-expense transition-colors"
                  title="Delete Budget"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-text-muted">Spent: <strong className="text-text-primary">{formatCurrency(spent)}</strong></span>
          <span className="text-text-muted">Limit: <strong className="text-text-primary">{formatCurrency(limit)}</strong></span>
        </div>
        
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-bg-card border border-border">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-in-out ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
        <span className="text-text-muted">
          {remaining >= 0 ? 'Remaining:' : 'Overbudget by:'}
        </span>
        <span className={`font-extrabold ${remaining >= 0 ? 'text-income' : 'text-expense flex items-center gap-1'}`}>
          {remaining < 0 && <AlertCircle size={13} />}
          {formatCurrency(Math.abs(remaining))}
        </span>
      </div>
    </div>
  );
}
