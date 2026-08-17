'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, Triangle } from 'lucide-react';

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
    <div
      className={`card relative overflow-hidden p-5 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md hover:border-accent/40 shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-accent/70 before:via-accent-light/40 before:to-transparent ${className}`}
    >
      {/* Card Header with Triangle Minimize Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Triangular Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-bg-secondary hover:bg-bg-hover border border-border/80 text-accent hover:text-white transition-all shadow-sm group cursor-pointer"
            title={isCollapsed ? 'Maximize / Expand' : 'Minimize / Collapse'}
          >
            <Triangle
              size={14}
              className={`transition-transform duration-300 fill-current ${
                isCollapsed ? 'rotate-90 text-text-muted group-hover:text-accent' : 'rotate-180 text-accent'
              }`}
            />
          </button>

          <div>
            {typeof title === 'string' ? (
              <h3 className="font-bold text-base text-text-primary">{title}</h3>
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
