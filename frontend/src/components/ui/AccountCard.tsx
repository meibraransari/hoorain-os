import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CreditCard, Landmark, PiggyBank, Briefcase, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="card relative overflow-hidden cursor-pointer bg-bg-card border border-border rounded-xl p-5 shadow-sm"
      style={{ borderTopColor: color, borderTopWidth: '4px' }}
    >
      <div className="flex justify-between items-start mb-4">
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
      
      <div className="mt-4">
        <h3 className="text-text-secondary font-medium">{account.name || 'Account'}</h3>
        <p className="text-2xl font-display font-bold text-text-primary mt-1">
          {formatPrivateCurrency(balance, account.currency || 'INR')}
        </p>
      </div>
    </motion.div>
  );
}
