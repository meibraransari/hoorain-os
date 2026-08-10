'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { ChevronDown } from 'lucide-react';

interface AreaChartProps {
  data: any[];
  title?: string;
  height?: number;
  action?: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function AreaChart({ data, title, height = 320, action, defaultCollapsed = false }: AreaChartProps) {
  const { isPrivate, formatPrivateCurrency } = usePrivacy();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const totalIncome = useMemo(() => {
    return (data || []).reduce((sum, item) => sum + (Number(item.income) || 0), 0);
  }, [data]);

  const totalExpense = useMemo(() => {
    return (data || []).reduce((sum, item) => sum + (Number(item.expense) || 0), 0);
  }, [data]);
  
  const textColor = theme === 'light' ? '#555577' : '#8888a8';
  const gridColor = theme === 'light' ? '#e0e0ef' : '#2a2a3a';
  const tooltipBg = theme === 'light' ? '#ffffff' : '#16161f';

  const currencySymbol = typeof window !== 'undefined' && localStorage.getItem('defaultCurrency') === 'USD' ? '$' : '₹';

  return (
    <div className="card p-6 border border-border rounded-xl space-y-4">
      {/* Header with Triangle Minimize/Maximize Toggle Button */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-bg-card hover:bg-bg-hover border border-border text-accent hover:text-accent-light transition-all shadow-sm group"
              title={isCollapsed ? 'Maximize / Expand' : 'Minimize / Collapse'}
            >
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${
                  isCollapsed ? '-rotate-90 text-text-muted group-hover:text-accent' : 'rotate-0'
                }`}
              />
            </button>
            <h3 className="font-bold text-lg text-text-primary">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {action}
          </div>
        </div>
      )}

      {/* Collapsible Content Body */}
      {!isCollapsed && (
        <div className="pt-2 border-t border-border/60 transition-all duration-300">
          <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10d88a" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10d88a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 11 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickFormatter={(value) => isPrivate ? `${currencySymbol}•••` : `${currencySymbol}${value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tooltipBg, 
                    borderRadius: '12px', 
                    border: `1px solid ${gridColor}`, 
                    color: textColor,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  formatter={(value: any, name: any) => [
                    formatPrivateCurrency(Number(value)), 
                    name === 'income' ? '💚 Income' : '🔴 Expense'
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: textColor, marginBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    if (value === 'income') {
                      return (
                        <span className="text-xs font-semibold text-text-primary mr-4 inline-flex items-center gap-1">
                          <span>💚 Income:</span>
                          <span className="text-income font-bold">{formatPrivateCurrency(totalIncome)}</span>
                        </span>
                      );
                    }
                    return (
                      <span className="text-xs font-semibold text-text-primary inline-flex items-center gap-1">
                        <span>🔴 Expense:</span>
                        <span className="text-expense font-bold">{formatPrivateCurrency(totalExpense)}</span>
                      </span>
                    );
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#10d88a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ff4d6d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
