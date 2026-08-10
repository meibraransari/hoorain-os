import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  trend?: number | string;
  trendType?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  trendUpIsGood?: boolean;
  subtitle?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, trend, trendType, icon, trendUpIsGood = true, subtitle, isLoading }: StatCardProps) {
  const isNumericTrend = typeof trend === 'number';
  const isPositive = isNumericTrend ? (trend as number) > 0 : trendType === 'up';
  const isGood = isPositive === trendUpIsGood;
  const trendColor = trendType === 'neutral' ? 'text-text-muted' : isGood ? 'text-success' : 'text-danger';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="scale-150 transform">{icon}</div>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-hover text-text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="h-8 w-28 rounded skeleton" />
        ) : (
          <div className="text-2xl font-display font-bold text-text-primary">{value}</div>
        )}
        {trend !== undefined && (
          <div className={cn('mt-1 flex items-center text-sm', trendColor)}>
            {isNumericTrend ? (
              <>
                {isPositive ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                <span>{Math.abs(trend as number)}% from last month</span>
              </>
            ) : (
              <span className="text-text-muted">{trend as string}</span>
            )}
          </div>
        )}
        {subtitle && !trend && (
          <div className="mt-1 text-xs text-text-muted">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}
