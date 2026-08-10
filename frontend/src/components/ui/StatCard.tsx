'use client';

import { useState, ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isNumericTrend = typeof trend === 'number';
  const isPositive = isNumericTrend ? (trend as number) > 0 : trendType === 'up';
  const isGood = isPositive === trendUpIsGood;
  const trendColor = trendType === 'neutral' ? 'text-text-muted' : isGood ? 'text-success' : 'text-danger';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card relative overflow-hidden p-5 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md hover:border-accent/40 shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-accent/70 before:via-accent-light/40 before:to-transparent group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Triangular Chevron Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-bg-secondary hover:bg-bg-hover border border-border/80 text-accent transition-all cursor-pointer"
            title={isCollapsed ? 'Maximize / Expand' : 'Minimize / Collapse'}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                isCollapsed ? '-rotate-90 text-text-muted' : 'rotate-0 text-accent'
              }`}
            />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {icon}
            </div>
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">{title}</h3>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-4 pt-3 border-t border-border/60 transition-all duration-300">
          {isLoading ? (
            <div className="h-8 w-28 rounded skeleton" />
          ) : (
            <div className="text-2xl font-display font-bold text-text-primary">{value}</div>
          )}
          {trend !== undefined && (
            <div className={cn('mt-1.5 flex items-center text-xs font-semibold', trendColor)}>
              {isNumericTrend ? (
                <>
                  {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  <span>{Math.abs(trend as number)}% from last month</span>
                </>
              ) : (
                <span className="text-text-muted">{trend as string}</span>
              )}
            </div>
          )}
          {subtitle && !trend && (
            <div className="mt-1 text-xs text-text-muted font-medium">{subtitle}</div>
          )}
        </div>
      )}
    </motion.div>
  );
}
