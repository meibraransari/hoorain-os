'use client';

import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '@/components/providers/PrivacyProvider';

export function PrivacyToggle() {
  const { isPrivate, togglePrivacy } = usePrivacy();

  return (
    <button
      type="button"
      onClick={togglePrivacy}
      title={isPrivate ? 'Click to show numeric balances' : 'Click to hide numeric balances'}
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-bg-card hover:bg-bg-hover transition-all shadow-sm group cursor-pointer"
    >
      <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary">
        {isPrivate ? 'Hide Balances' : 'Show Balances'}
      </span>
      
      {/* Interactive Toggle Switch Track */}
      <div
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isPrivate ? 'bg-accent' : 'bg-bg-hover border-border'
        }`}
      >
        {/* Animated Sliding Thumb */}
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            isPrivate ? 'translate-x-4' : 'translate-x-0'
          }`}
        >
          {isPrivate ? (
            <EyeOff size={10} className="text-accent" />
          ) : (
            <Eye size={10} className="text-text-muted" />
          )}
        </span>
      </div>
    </button>
  );
}
