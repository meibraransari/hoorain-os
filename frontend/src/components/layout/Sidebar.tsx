'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, Wallet as WalletIcon, ArrowLeftRight, Tag, PieChart, 
  Target, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  User, HandCoins, CalendarClock, BrainCircuit, Calculator, Github,
  ChevronUp, BarChart3
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    group: 'Dashboards',
    items: [
      { icon: LayoutDashboard, label: 'Main Overview', href: '/dashboard' },
      { icon: BarChart3, label: 'Cashflow Analytics', href: '/dashboard-analytics' },
      { icon: Target, label: 'Planning & Future', href: '/dashboard-planning' },
    ]
  },
  {
    group: 'Management',
    items: [
      { icon: Wallet, label: 'Accounts', href: '/accounts' },
      { icon: ArrowLeftRight, label: 'Transactions', href: '/transactions' },
      { icon: HandCoins, label: 'Lent & Borrow', href: '/lent-borrow' },
      { icon: Tag, label: 'Categories', href: '/categories' },
      { icon: FileText, label: 'Reports & Export', href: '/reports' },
    ]
  },
  {
    group: 'Advanced',
    items: [
      { icon: CalendarClock, label: 'Upcoming Bills', href: '/bills-recurring' },
      { icon: BrainCircuit, label: 'AI Health', href: '/financial-health' },
      { icon: Calculator, label: 'Debt Planner', href: '/debt-planner' },
      { icon: PieChart, label: 'Budgets', href: '/budgets' },
      { icon: Target, label: 'Goals', href: '/goals' },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { logout } = useAuth();
  const user = useAuthStore(state => state.user);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close popover when pathname changes
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname]);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/80 bg-bg-card/95 backdrop-blur-xl transition-all duration-300 shadow-2xl"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden text-text-primary group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/30 group-hover:scale-105 transition-transform">
              <WalletIcon size={18} />
            </div>
            <span className="font-display font-extrabold text-lg whitespace-nowrap tracking-tight">Hoorain OS</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/dashboard" className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/30 hover:scale-105 transition-transform">
            <WalletIcon size={18} />
          </Link>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        <nav className="flex flex-col gap-4 px-2.5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = item.href === '/dashboard' 
                  ? pathname === item.href 
                  : pathname.startsWith(item.href);
                  
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group relative cursor-pointer",
                      isActive 
                        ? "bg-accent/10 text-accent font-bold shadow-sm border border-accent/20" 
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
                    <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-accent" : "group-hover:text-accent")} />
                    {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Lower Sidebar — Professional Profile, Settings & Quick Actions */}
      <div className="p-3 border-t border-border/80 bg-bg-secondary/40 relative" ref={profileMenuRef}>
        
        {/* Dropup Profile Menu Popover */}
        <AnimatePresence>
          {isProfileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute bottom-full mb-3 rounded-2xl border border-border/80 bg-bg-card/95 backdrop-blur-2xl shadow-2xl z-50 p-3.5 space-y-3",
                sidebarCollapsed ? "left-2 w-64" : "left-3 right-3"
              )}
            >
              {/* Header Info */}
              <div className="flex items-center gap-3 border-b border-border/80 pb-3">
                <div className="relative h-10 w-10 shrink-0 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 font-extrabold text-sm">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'A'
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-income ring-2 ring-bg-card" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-bold text-text-primary">{user?.name || 'Administrator'}</p>
                  <p className="truncate text-[11px] text-text-muted">{user?.email || 'admin@financeos.local'}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                    pathname === '/profile' ? "bg-accent/10 text-accent font-bold" : "text-text-primary hover:bg-bg-hover"
                  )}
                >
                  <User size={15} className="text-accent" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                    pathname === '/settings' ? "bg-accent/10 text-accent font-bold" : "text-text-primary hover:bg-bg-hover"
                  )}
                >
                  <Settings size={15} className="text-accent" />
                  <span>Preferences & Settings</span>
                </Link>

                <a
                  href="https://github.com/meibraransari/hoorain-os.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
                >
                  <Github size={15} className="text-accent" />
                  <span>GitHub Repository</span>
                </a>
              </div>

              <div className="border-t border-border/80 pt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-expense hover:bg-expense/10 transition-all cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lower Sidebar Bottom Bar */}
        {!sidebarCollapsed ? (
          <div className="space-y-2">
            {/* User Profile Card (Clicking opens menu) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-bg-card border border-border/60 hover:border-accent/40 transition-all">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left group cursor-pointer"
              >
                <div className="relative h-9 w-9 shrink-0 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 font-bold text-xs group-hover:scale-105 transition-transform">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'A'
                  )}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-income ring-2 ring-bg-card" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="truncate text-[10px] text-text-muted font-medium">
                    {user?.email || 'admin@financeos.local'}
                  </p>
                </div>
                <ChevronUp size={14} className={cn("text-text-muted transition-transform shrink-0 mr-1", isProfileMenuOpen && "rotate-180")} />
              </button>

              {/* Quick Settings Icon Button */}
              <Link
                href="/settings"
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border border-border/60 hover:border-accent hover:bg-accent/10 transition-all cursor-pointer",
                  pathname === '/settings' ? "bg-accent text-white border-accent" : "text-text-secondary hover:text-accent"
                )}
                title="Settings"
              >
                <Settings size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 font-bold text-xs hover:scale-105 transition-transform cursor-pointer"
              title="User Menu"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
              ) : (
                user?.name?.charAt(0) || 'A'
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-income ring-2 ring-bg-card" />
            </button>

            <Link
              href="/settings"
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center border border-border/60 hover:border-accent hover:bg-accent/10 transition-all cursor-pointer",
                pathname === '/settings' ? "bg-accent text-white border-accent" : "text-text-secondary hover:text-accent"
              )}
              title="Settings"
            >
              <Settings size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* Collapse Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-accent z-50 shadow-md transition-colors cursor-pointer"
        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}
