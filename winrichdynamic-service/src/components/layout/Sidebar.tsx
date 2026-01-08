"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminB2BMenuItems } from './adminB2BMenu';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[var(--admin-sidebar-width)] min-h-0 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
      <div className="px-4 pt-5 pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          เมนูหลัก
        </div>
      </div>
      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        {adminB2BMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          
          return (
            <Link
              key={item.id}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all relative ${
                isActive
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <div className={`${item.color} flex h-9 w-9 items-center justify-center rounded-lg shadow-sm`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
