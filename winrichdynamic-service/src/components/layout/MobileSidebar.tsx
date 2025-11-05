"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Building2,
  Target,
  FileText,
  ShoppingCart,
  CheckSquare,
  PieChart,
  Settings,
  TrendingUp,
  UserPlus,
  Package,
  Handshake,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const menuItems = [
  { id: 'dashboard', label: 'แผงบริหาร', icon: BarChart3, path: '/adminb2b/dashboard', color: 'bg-blue-500', badge: null },
  { id: 'leads', label: 'Leads', icon: UserPlus, path: '/adminb2b/leads', color: 'bg-yellow-500', badge: null },
  { id: 'customers', label: 'ลูกค้า', icon: Users, path: '/adminb2b/customers', color: 'bg-orange-500', badge: null },
  { id: 'deals', label: 'ดีล', icon: Handshake, path: '/adminb2b/deals', color: 'bg-cyan-500', badge: null },
  { id: 'opportunities', label: 'โอกาส', icon: Target, path: '/adminb2b/opportunities', color: 'bg-purple-500', badge: null },
  { id: 'quotations', label: 'ใบเสนอราคา', icon: FileText, path: '/adminb2b/quotations', color: 'bg-red-500', badge: null },
  { id: 'sales-orders', label: 'ใบสั่งขาย', icon: ShoppingCart, path: '/adminb2b/sales-orders', color: 'bg-blue-600', badge: null },
  { id: 'products', label: 'สินค้า', icon: Package, path: '/adminb2b/products', color: 'bg-emerald-500', badge: null },
  { id: 'projects', label: 'โครงการ', icon: Building2, path: '/adminb2b/projects', color: 'bg-green-500', badge: null },
  { id: 'tasks', label: 'งานติดตาม', icon: CheckSquare, path: '/adminb2b/tasks', color: 'bg-pink-500', badge: null },
  { id: 'forecast', label: 'คาดการณ์', icon: TrendingUp, path: '/adminb2b/forecast', color: 'bg-teal-500', badge: null },
  { id: 'reports', label: 'รายงาน', icon: PieChart, path: '/adminb2b/reports', color: 'bg-indigo-500', badge: null },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/adminb2b/settings', color: 'bg-gray-500', badge: null },
];

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
      <aside className="fixed top-0 left-0 h-full w-16 bg-gradient-to-b from-blue-100 to-blue-200 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-blue-300">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-blue-300"
          >
            <X className="h-4 w-4 text-gray-700" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onClose}
                className={`flex flex-col items-center justify-center gap-1 py-3 transition-all relative ${
                  isActive
                    ? 'bg-blue-300 text-gray-800 shadow-md'
                    : 'text-gray-800 hover:bg-blue-300/50'
                }`}
              >
                <div className={`${item.color} p-1.5 rounded-lg shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-center w-full px-1">{item.label}</span>
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
