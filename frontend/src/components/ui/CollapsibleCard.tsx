'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

export function CollapsibleCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  defaultCollapsed = false,
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`card p-6 border border-border rounded-xl transition-all ${className}`}>
      {/* Card Header with Triangle Minimize/Maximize Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Triangle Chevron Toggle Button */}
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

          <div>
            {typeof title === 'string' ? (
              <h3 className="font-bold text-lg text-text-primary">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action}
        </div>
      </div>

      {/* Card Content Body */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-border/60 transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
