import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CreditCard, Landmark, PiggyBank, Briefcase, Wallet, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AccountCardProps {
  account: any;
}

export function AccountCard({ account }: AccountCardProps) {
  const { formatPrivateCurrency } = usePrivacy();
  if (!account) return null;

  const getIcon = () => {
    const type = (account.type || '').toLowerCase();
    if (type.includes('credit')) return <CreditCard size={24} />;
    if (type.includes('saving')) return <PiggyBank size={24} />;
    if (type.includes('invest') || type.includes('crypto')) return <Briefcase size={24} />;
    if (type.includes('cash')) return <Wallet size={24} />;
    return <Landmark size={24} />;
  };

  const balance = typeof account.currentBalance === 'number'
    ? account.currentBalance
    : typeof account.balance === 'number'
    ? account.balance
    : parseFloat(account.currentBalance || account.balance) || 0;

  const color = account.color || '#3f51b5';
  const targetId = account.id || account.name;

  return (
    <Link href={`/reports?account=${encodeURIComponent(targetId)}`} className="block">
      <motion.div 
        whileHover={{ y: -4, scale: 1.02 }}
        className="card relative overflow-hidden cursor-pointer bg-bg-card border border-border rounded-xl p-5 shadow-sm group hover:border-accent/50 transition-all"
        style={{ borderTopColor: color, borderTopWidth: '4px' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            {getIcon()}
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-bg-secondary text-text-secondary uppercase tracking-wider">
            {account.type || 'Account'}
          </span>
        </div>
        
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-text-secondary font-medium">{account.name || 'Account'}</h3>
            <p className="text-2xl font-display font-bold text-text-primary mt-1">
              {formatPrivateCurrency(balance, account.currency || 'INR')}
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all shrink-0">
            <span>Transactions</span>
            <ArrowUpRight size={13} />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
