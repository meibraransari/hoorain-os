'use client';

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Coffee, Activity, ShoppingCart, Heart, Package, Utensils, ChevronDown } from 'lucide-react';

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  count?: number;
  percentage?: number;
  icon?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  height?: number;
  defaultCollapsed?: boolean;
}

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('grocery') || n.includes('groceries')) return <ShoppingCart size={16} />;
  if (n.includes('milk')) return <Utensils size={16} />;
  if (n.includes('snack') || n.includes('food')) return <Coffee size={16} />;
  if (n.includes('medical') || n.includes('health')) return <Activity size={16} />;
  if (n.includes('shop') || n.includes('cloth')) return <ShoppingBag size={16} />;
  if (n.includes('fruit') || n.includes('dry')) return <Heart size={16} />;
  return <Package size={16} />;
};

export function PieChart({ data, title, height = 320, defaultCollapsed = false }: PieChartProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const textColor = theme === 'light' ? '#555577' : '#8888a8';
  const tooltipBg = theme === 'light' ? '#ffffff' : '#16161f';
  const gridColor = theme === 'light' ? '#e0e0ef' : '#2a2a3a';

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Compute percentage if not passed
  const processedData = data.map((item) => ({
    ...item,
    percentage: item.percentage ?? (totalValue > 0 ? Math.round((item.value / totalValue) * 1000) / 10 : 0),
  }));

  const activeItem = activeIndex !== null && processedData[activeIndex] ? processedData[activeIndex] : null;

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

          <span className="text-xs text-text-muted font-medium bg-bg-card/70 px-2.5 py-1 rounded-lg border border-border">
            Total: {formatCurrency(totalValue)}
          </span>
        </div>
      )}

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-5 pt-2 border-t border-border/60 transition-all duration-300">
          {/* Donut Chart with Center Summary Callout */}
          <div className="relative" style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{
                        filter: activeIndex === index ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tooltipBg, 
                    borderRadius: '12px', 
                    border: `1px solid ${gridColor}`, 
                    color: textColor,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  formatter={(value: number, name: any, props: any) => [
                    `${formatCurrency(value)} (${props.payload.percentage}%)`,
                    props.payload.name
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                {activeItem ? activeItem.name : 'Total Expense'}
              </span>
              <span className="text-lg font-bold text-text-primary mt-0.5">
                {formatCurrency(activeItem ? activeItem.value : totalValue)}
              </span>
              <span className="text-[10px] font-semibold text-accent mt-0.5">
                {activeItem ? `${activeItem.percentage}% of total` : `${data.length} Categories`}
              </span>
            </div>
          </div>

          {/* Cashew-Style Category Breakdown Cards List */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            {processedData.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'border-accent bg-accent/5 shadow-md scale-[1.01]'
                      : 'border-border bg-bg-card/50 hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: item.color }}
                      >
                        {getCategoryIcon(item.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">{item.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-bg-card border border-border text-text-secondary">
                            {item.percentage}%
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {item.count ? `${item.count} transaction${item.count > 1 ? 's' : ''}` : 'Expense category'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-text-primary block">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {item.percentage}% of total
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-bg-card/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
