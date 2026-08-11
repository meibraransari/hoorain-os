import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { format } from 'date-fns';
import {
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Smartphone,
  Briefcase,
  HelpCircle,
  ArrowRightLeft,
  PieChart,
  Target,
  FileText,
} from 'lucide-react';
import { ReactNode } from 'react';

interface TransactionItemProps {
  transaction: any;
  action?: ReactNode;
}

const getCategoryIcon = (categoryName?: string, isTransfer?: boolean) => {
  if (isTransfer) return <ArrowRightLeft size={18} />;
  if (!categoryName) return <HelpCircle size={18} />;
  const cat = categoryName.toLowerCase();
  if (cat.includes('food') || cat.includes('groceries') || cat.includes('snack') || cat.includes('milk') || cat.includes('bakery')) return <Coffee size={18} />;
  if (cat.includes('shop') || cat.includes('clothes') || cat.includes('dry') || cat.includes('computer')) return <ShoppingBag size={18} />;
  if (cat.includes('transport') || cat.includes('fuel') || cat.includes('petrol') || cat.includes('metro') || cat.includes('service')) return <Car size={18} />;
  if (cat.includes('house') || cat.includes('rent') || cat.includes('electricity') || cat.includes('gas')) return <Home size={18} />;
  if (cat.includes('phone') || cat.includes('mobile') || cat.includes('entertainment')) return <Smartphone size={18} />;
  if (cat.includes('salary') || cat.includes('income') || cat.includes('work') || cat.includes('freelance') || cat.includes('bonus')) return <Briefcase size={18} />;
  return <HelpCircle size={18} />;
};

export function TransactionItem({ transaction, action }: TransactionItemProps) {
  const { formatPrivateCurrency } = usePrivacy();
  if (!transaction) return null;

  const rawAmount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0;
  const isTransfer = transaction.isTransfer || transaction.type === 'transfer';
  const isIncome = !isTransfer && (transaction.type === 'income' || transaction.income === 1);

  const categoryName = typeof transaction.category === 'string'
    ? transaction.category
    : transaction.category?.name || (isTransfer ? 'Transfer' : 'General');

  const accountName = typeof transaction.account === 'string'
    ? transaction.account
    : transaction.account?.name || 'Account';

  const budgetName = typeof transaction.budget === 'string'
    ? transaction.budget
    : transaction.budget?.name || transaction.budgetName || null;

  const goalName = typeof transaction.goal === 'string'
    ? transaction.goal
    : transaction.goal?.name || transaction.goalName || null;

  let formattedTime = '';
  if (transaction.date) {
    try {
      const d = new Date(transaction.date);
      if (!isNaN(d.getTime())) {
        formattedTime = format(d, 'HH:mm');
      }
    } catch (e) {
      formattedTime = '';
    }
  }

  // Ensure title and notes are decoupled cleanly
  const primaryTitle = transaction.title || categoryName || 'Transaction';
  const rawNotes = transaction.notes || transaction.description || '';
  const hasNotes = Boolean(rawNotes && rawNotes.trim() !== '');

  return (
    <div className="group flex items-center justify-between p-3.5 px-4 rounded-2xl bg-[#141420] border border-[#26263a] hover:bg-[#1a1a2b] hover:border-[#6c63ff]/60 hover:shadow-xl transition-all duration-200 cursor-pointer my-1.5">
      <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-3">
        {/* Category Avatar Icon Tile */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 mt-0.5 shadow-md ${
            isTransfer
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-violet-500/10'
              : isIncome
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-rose-500/10'
          }`}
        >
          {getCategoryIcon(categoryName, isTransfer)}
        </div>

        {/* Content Details Block */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[#ffffff] text-[15px] tracking-tight truncate group-hover:text-[#8b85ff] transition-colors">
              {primaryTitle}
            </h4>

            {transaction.excludeFromBalance && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                Excluded
              </span>
            )}
          </div>

          {/* Account, Category, Budget & Goal Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#1e1e2e] text-[#a0a0cc] text-[11px] font-semibold border border-[#2d2d44]">
              🏷️ {categoryName}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#1e1e2e] text-[#a0a0cc] text-[11px] font-semibold border border-[#2d2d44]">
              🏦 {accountName}
            </span>

            {/* Optional Linked Monthly Budget Pill */}
            {budgetName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#251c42] text-[#c4b5fd] border border-[#3b2d6b] text-[11px] font-bold shadow-xs">
                <PieChart size={12} className="text-[#a78bfa] shrink-0" />
                <span>Budget: {budgetName}</span>
              </span>
            )}

            {/* Optional Linked Financial Goal Pill */}
            {goalName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#132e27] text-[#6ee7b7] border border-[#1f4e42] text-[11px] font-bold shadow-xs">
                <Target size={12} className="text-[#34d399] shrink-0" />
                <span>Goal: {goalName}</span>
              </span>
            )}
          </div>

          {/* Dedicated High-Contrast Transaction Notes Block */}
          {hasNotes && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10101a] border border-[#2b2b40] text-xs text-[#c0c0e0] font-medium shadow-xs">
              <FileText size={13} className="shrink-0 text-[#8b85ff]" />
              <span className="truncate">{rawNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount & Time Display on Right Side */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end">
          <span
            className={`font-extrabold text-[16px] tracking-tight ${
              isTransfer
                ? 'text-[#60a5fa]'
                : isIncome
                ? 'text-[#10d88a]'
                : 'text-[#ffffff]'
            }`}
          >
            {isTransfer ? '' : isIncome ? '+' : '-'}{formatPrivateCurrency(Math.abs(rawAmount))}
          </span>
          {formattedTime && (
            <span className="text-[12px] text-[#8888a8] mt-0.5 font-medium tracking-wide">
              {formattedTime}
            </span>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
