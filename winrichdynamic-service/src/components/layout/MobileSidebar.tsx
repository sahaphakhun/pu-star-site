"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminB2BMenuItems } from './adminB2BMenu';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[var(--admin-sidebar-width)] min-h-0 flex flex-col border-r border-slate-200 bg-white/95 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="h-16 flex items-center justify-between border-b border-slate-200 px-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            เมนูหลัก
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-600" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {adminB2BMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onClose}
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
    </>
  );
}
