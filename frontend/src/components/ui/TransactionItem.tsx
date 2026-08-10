import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { format } from 'date-fns';
import { ShoppingBag, Coffee, Car, Home, Smartphone, Briefcase, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface TransactionItemProps {
  transaction: any;
  action?: ReactNode;
}

const getCategoryIcon = (categoryName?: string, isTransfer?: boolean) => {
  if (isTransfer) return <ArrowRightLeft size={16} />;
  if (!categoryName) return <HelpCircle size={16} />;
  const cat = categoryName.toLowerCase();
  if (cat.includes('food') || cat.includes('groceries') || cat.includes('snack') || cat.includes('milk') || cat.includes('bakery')) return <Coffee size={16} />;
  if (cat.includes('shop') || cat.includes('clothes') || cat.includes('dry') || cat.includes('computer')) return <ShoppingBag size={16} />;
  if (cat.includes('transport') || cat.includes('fuel') || cat.includes('petrol') || cat.includes('metro') || cat.includes('service')) return <Car size={16} />;
  if (cat.includes('house') || cat.includes('rent') || cat.includes('electricity') || cat.includes('gas')) return <Home size={16} />;
  if (cat.includes('phone') || cat.includes('mobile') || cat.includes('entertainment')) return <Smartphone size={16} />;
  if (cat.includes('salary') || cat.includes('income') || cat.includes('work') || cat.includes('freelance') || cat.includes('bonus')) return <Briefcase size={16} />;
  return <HelpCircle size={16} />;
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

  const primaryTitle = transaction.title || transaction.notes || transaction.name || categoryName || 'Transaction';
  const secondaryNote = transaction.title && transaction.notes ? transaction.notes : null;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-bg-hover/50 transition-colors group cursor-pointer border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
          isTransfer
            ? 'bg-accent/10 text-accent'
            : isIncome
            ? 'bg-income/10 text-income'
            : 'bg-expense/10 text-expense'
        }`}>
          {getCategoryIcon(categoryName, isTransfer)}
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="font-semibold text-text-primary text-[15px] leading-snug truncate">{primaryTitle}</h4>
          <div className="flex items-center gap-2 text-[13px] text-text-muted mt-0.5 font-medium truncate">
            <span>{categoryName}</span>
            <span className="opacity-50">•</span>
            <span>{accountName}</span>
            {transaction.excludeFromBalance && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                Excluded from Balance
              </span>
            )}
            {secondaryNote && (
              <>
                <span className="opacity-50">•</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{secondaryNote}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end">
          <span className={`font-semibold text-[15px] tracking-tight ${
            isTransfer
              ? 'text-text-primary'
              : isIncome
              ? 'text-income'
              : 'text-text-primary'
          }`}>
            {isTransfer ? '' : isIncome ? '+' : '-'}{formatPrivateCurrency(Math.abs(rawAmount))}
          </span>
          {formattedTime && <span className="text-[12px] text-text-muted/70 mt-0.5 font-medium tracking-wide">{formattedTime}</span>}
        </div>

        {action && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
