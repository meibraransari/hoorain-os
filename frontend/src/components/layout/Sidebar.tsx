'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, Tag, PieChart, 
  Target, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Wallet as WalletIcon, User, HandCoins, CalendarClock, BrainCircuit, Calculator
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: ArrowLeftRight, label: 'Transactions', href: '/transactions' },
  { icon: HandCoins, label: 'Lent & Borrow', href: '/lent-borrow' },
  { icon: CalendarClock, label: 'Overdue & Upcoming', href: '/bills-recurring' },
  { icon: BrainCircuit, label: 'AI Health & Insights', href: '/financial-health' },
  { icon: Calculator, label: 'Debt Payoff Planner', href: '/debt-planner' },
  { icon: Tag, label: 'Categories', href: '/categories' },
  { icon: PieChart, label: 'Budgets', href: '/budgets' },
  { icon: Target, label: 'Goals', href: '/goals' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { logout } = useAuth();
  const user = useAuthStore(state => state.user);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-bg-card transition-all duration-300"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden text-text-primary">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
              <WalletIcon size={18} />
            </div>
            <span className="font-display font-bold text-lg whitespace-nowrap">Hoorain</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
            <WalletIcon size={18} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group relative",
                  isActive 
                    ? "bg-accent/10 text-accent font-medium" 
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -mt-2 h-4 w-1 rounded-r-full bg-accent"
                  />
                )}
                <item.icon size={20} className="shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        {!sidebarCollapsed ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 mb-4 p-1 rounded-xl hover:bg-bg-hover transition-colors group cursor-pointer"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center border border-accent/30 font-bold text-text-primary group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-text-muted">{user?.email || 'admin@hoorain.app'}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/profile"
            className="h-10 w-10 mx-auto shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center border border-accent/30 mb-4 font-bold text-text-primary hover:scale-105 transition-transform block"
            title="User Profile"
          >
            {user?.name?.charAt(0) || 'U'}
          </Link>
        )}
        <button 
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors",
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-accent z-50 shadow-md transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}
