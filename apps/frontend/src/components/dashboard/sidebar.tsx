'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2, Users,
  Bot, Settings, LogOut, Store, ChevronDown, Zap, Palette,
  Globe, CreditCard, HelpCircle, LayoutTemplate, Eye, Menu,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

interface NavSection {
  label?: string;
  items: { href: string; label: string; icon: React.ElementType; badge?: string }[];
}

const sections: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Store',
    items: [
      { href: '/dashboard/products', label: 'Products', icon: Package },
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
      { href: '/dashboard/agents', label: 'AI Agents', icon: Bot, badge: 'AI' },
    ],
  },
  {
    label: 'Customize',
    items: [
      { href: '/dashboard/site', label: 'Site', icon: LayoutTemplate },
      { href: '/dashboard/navigation', label: 'Navigation', icon: Menu },
      { href: '/dashboard/theme', label: 'Theme', icon: Palette },
      { href: '/dashboard/preview', label: 'Preview Store', icon: Eye },
      { href: '/dashboard/domains', label: 'Domains', icon: Globe },
      { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, currentStore, logout } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-[#0c0c0c] flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <Zap size={13} className="text-black" />
          </div>
          <span className="text-white font-semibold text-[13px] tracking-tight">Agentic</span>
        </div>
      </div>

      {/* Store selector */}
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <div className="w-7 h-7 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-white/10">
            <Store size={12} className="text-white/80" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-medium text-white truncate">
              {currentStore?.name ?? 'Select store'}
            </p>
            <p className="text-[10px] text-white/35 truncate">
              {currentStore?.subdomain ?? 'store'}.yourdomain.com
            </p>
          </div>
          <ChevronDown size={11} className="text-white/30 shrink-0" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-3' : ''}>
            {section.label && (
              <div className="px-2 mb-1">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                  {section.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    )}
                  >
                    <Icon size={15} className={isActive ? 'text-black' : ''} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={clsx(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-md',
                          isActive
                            ? 'bg-black/10 text-black/60'
                            : 'bg-white/10 text-white/40'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Help */}
      <div className="px-2.5 pb-1">
        <Link
          href="/dashboard/help"
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all"
        >
          <HelpCircle size={15} />
          Help & Support
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500/80 to-indigo-600/80 rounded-full flex items-center justify-center ring-1 ring-white/10">
            <span className="text-white text-[10px] font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] font-medium text-white/30 hover:bg-white/[0.06] hover:text-red-400 transition-colors mt-0.5"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
