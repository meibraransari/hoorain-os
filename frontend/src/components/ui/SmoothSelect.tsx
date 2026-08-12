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
  dropPosition?: 'auto' | 'top' | 'bottom';
}

export function SmoothSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  searchable = false,
  dropPosition = 'auto',
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
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const positionClass = dropPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 bg-bg-secondary border rounded-xl text-sm flex items-center justify-between transition-all duration-200 focus:outline-none shadow-xs ${
          isOpen
            ? 'border-accent ring-2 ring-accent/30 bg-bg-card shadow-lg shadow-accent/10'
            : 'border-border hover:border-accent/60 hover:bg-bg-hover'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-2.5 truncate text-text-primary font-medium">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 flex items-center justify-center text-sm">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-text-secondary">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-secondary shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 w-full bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-150 ${positionClass}`}>
          {searchable && (
            <div className="p-2.5 border-b border-border-subtle bg-bg-secondary">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-text-secondary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-hover border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-medium"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-text-secondary text-center italic">
                No matching options
              </div>
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
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/20 text-accent font-bold ring-1 ring-accent/40 shadow-xs'
                        : 'text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                      {opt.icon && (
                        <span className="shrink-0 text-base flex items-center justify-center">
                          {opt.icon}
                        </span>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold truncate leading-snug">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="text-[10px] text-text-secondary font-medium truncate mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-accent shrink-0 font-bold" />}
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
