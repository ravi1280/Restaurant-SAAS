'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Menu, Utensils } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Sidebar Wrapper */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-200 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay Backdrop for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/55 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar for Mobile Screens */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border z-20">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted hover:text-primary hover:bg-elevated rounded-xl transition-all"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <Utensils size={18} className="text-accent" />
            <span className="font-heading font-bold text-sm text-primary">TableFlow OS</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            A
          </div>
        </header>

        {/* Responsive Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
