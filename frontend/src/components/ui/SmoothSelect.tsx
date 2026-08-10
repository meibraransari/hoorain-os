'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SmoothSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function SmoothSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  searchable = false,
}: SmoothSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable && search
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Select Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 bg-bg-card border rounded-xl text-sm flex items-center justify-between transition-all duration-200 focus:outline-none ${
          isOpen
            ? 'border-accent ring-2 ring-accent/20 shadow-md'
            : 'border-border hover:border-accent/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-2 truncate text-text-primary font-medium">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Smooth Animated Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {searchable && (
            <div className="p-2 border-b border-border bg-bg-hover/30">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-card border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium rounded-lg flex items-center justify-between transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-text-primary hover:bg-bg-hover hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0 text-sm">{opt.icon}</span>}
                      <div>
                        <div>{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-text-muted">{opt.description}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
