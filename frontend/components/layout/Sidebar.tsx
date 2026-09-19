'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Activity,
  HeartPulse,
  DollarSign,
  Sparkles,
  ShieldCheck,
  PieChart,
  History,
  CloudCog,
} from 'lucide-react';

interface SidebarProps {
  pendingRecommendationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingRecommendationsCount = 0 }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Resources', href: '/resources', icon: Server },
    { label: 'Live Monitoring', href: '/monitoring', icon: Activity },
    { label: 'Service Health', href: '/health', icon: HeartPulse },
    { label: 'Costs & Billing', href: '/costs', icon: DollarSign },
    {
      label: 'Recommendations',
      href: '/recommendations',
      icon: Sparkles,
      badge: pendingRecommendationsCount > 0 ? pendingRecommendationsCount : null,
    },
    { label: 'Policies', href: '/policies', icon: ShieldCheck },
    { label: 'Budgets', href: '/budgets', icon: PieChart },
    { label: 'Audit Trail', href: '/audit', icon: History },
    { label: 'Cloud Accounts', href: '/cloud-accounts', icon: CloudCog },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950/60 backdrop-blur-sm p-4 hidden md:flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Cloud Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cluster / Cloud Info */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-400">
        <div className="flex items-center justify-between font-semibold text-slate-300 mb-1.5">
          <span>Connected Region</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
            ap-south-1
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          CloudOps unified control plane orchestrating AWS & mock resources with server-side governance.
        </p>
      </div>
    </aside>
  );
};
