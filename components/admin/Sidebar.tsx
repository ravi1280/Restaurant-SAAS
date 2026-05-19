'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Grid3X3, UtensilsCrossed, ChefHat,
  BookOpen, Calendar, Star, Settings, Bell, Users, Package, Sun, Moon
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  group: string;
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { orders, reservations } = useRestaurant();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('tableflow_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else if (prefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('tableflow_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;

  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r =>
    r.date === today && r.status === 'confirmed'
  ).length;

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, group: 'FRONT OF HOUSE' },
    { label: 'Floor Plan', href: '/admin/floor', icon: <Grid3X3 size={18} />, group: 'FRONT OF HOUSE' },
    { label: 'Orders', href: '/admin/orders', icon: <UtensilsCrossed size={18} />, group: 'FRONT OF HOUSE' },
    { label: 'Kitchen Display', href: '/admin/kitchen', icon: <ChefHat size={18} />, badge: activeOrders, group: 'BACK OF HOUSE' },
    { label: 'Menu Manager', href: '/admin/menu', icon: <BookOpen size={18} />, group: 'BACK OF HOUSE' },
    { label: 'Inventory & COGS', href: '/admin/inventory', icon: <Package size={18} />, group: 'BACK OF HOUSE' },
    { label: 'Reservations', href: '/admin/reservations', icon: <Calendar size={18} />, badge: todayReservations, group: 'BACK OF HOUSE' },
    { label: 'Staff & Shifts', href: '/admin/staff', icon: <Users size={18} />, group: 'BACK OF HOUSE' },
    { label: 'Loyalty Points', href: '/admin/loyalty', icon: <Star size={18} />, group: 'CUSTOMERS' },
    { label: 'Settings & QR', href: '/admin/settings', icon: <Settings size={18} />, group: 'CUSTOMERS' },
  ];

  const groups = ['FRONT OF HOUSE', 'BACK OF HOUSE', 'CUSTOMERS'];

  return (
    <div className="w-60 h-full bg-surface border-r border-border flex flex-col relative">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white text-base">
            🍽
          </div>
          <div>
            <p className="text-sm font-semibold text-primary leading-none">TableFlow</p>
            <p className="text-xs text-muted mt-0.5">Restaurant OS</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-muted hover:text-primary hover:bg-elevated rounded-lg transition-colors"
            title="Close sidebar"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {groups.map(group => {
          const items = navItems.filter(n => n.group === group);
          return (
            <div key={group}>
              <p className="px-2.5 mb-1.5 text-[10px] font-semibold text-hint uppercase tracking-widest">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 group relative
                        ${isActive
                          ? 'bg-accent/15 text-accent font-medium'
                          : 'text-muted hover:text-primary hover:bg-elevated'
                        }`}
                    >
                      <span className={`${isActive ? 'text-accent' : 'text-hint group-hover:text-muted'} transition-colors`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="min-w-[18px] h-4.5 px-1.5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex flex-col gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-colors text-sm w-full"
        >
          {theme === 'dark' ? <Sun size={14} className="text-warning" /> : <Moon size={14} className="text-loyalty" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary truncate">Admin</p>
            <p className="text-[10px] text-muted truncate">Restaurant Manager</p>
          </div>
          <Bell size={14} className="text-hint" />
        </div>
      </div>
    </div>
  );
}
