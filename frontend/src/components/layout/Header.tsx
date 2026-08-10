'use client';

import { Bell, Search, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { usePathname } from 'next/navigation';

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  
  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-semibold text-text-primary hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions, accounts (Cmd+K)" 
            className="w-full rounded-full border border-border bg-bg-secondary py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary transition-colors">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-bg-card"></span>
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary">
              {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="z-50 min-w-[150px] overflow-hidden rounded-xl border border-border bg-bg-card p-1 shadow-lg animate-fade-in"
              align="end"
            >
              {[
                { id: 'dark', label: 'Dark (Default)' },
                { id: 'light', label: 'Light' },
                { id: 'amoled', label: 'AMOLED' },
                { id: 'cyberpunk', label: 'Cyberpunk' },
                { id: 'glassmorphism', label: 'Glassmorphism' }
              ].map(t => (
                <DropdownMenu.Item 
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-bg-hover hover:text-text-primary ${theme === t.id ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary'}`}
                >
                  {t.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
