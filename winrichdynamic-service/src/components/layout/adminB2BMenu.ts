import type { LucideIcon } from 'lucide-react';
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
  ClipboardList,
  Tags,
  ClipboardCheck,
  UserCog,
  Shield,
  MessageSquare,
} from 'lucide-react';

export interface AdminB2BMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  color: string;
  badge: string | number | null;
}

export const adminB2BMenuItems: AdminB2BMenuItem[] = [
  { id: 'dashboard', label: 'แผงบริหาร', icon: BarChart3, path: '/adminb2b/dashboard', color: 'bg-blue-500', badge: null },
  { id: 'leads', label: 'Leads', icon: UserPlus, path: '/adminb2b/leads', color: 'bg-yellow-500', badge: null },
  { id: 'customers', label: 'ลูกค้า', icon: Users, path: '/adminb2b/customers', color: 'bg-orange-500', badge: null },
  { id: 'deals', label: 'ดีล', icon: Handshake, path: '/adminb2b/deals', color: 'bg-cyan-500', badge: null },
  { id: 'opportunities', label: 'โอกาส', icon: Target, path: '/adminb2b/opportunities', color: 'bg-purple-500', badge: null },
  { id: 'quotations', label: 'ใบเสนอราคา', icon: FileText, path: '/adminb2b/quotations', color: 'bg-red-500', badge: null },
  { id: 'sales-orders', label: 'ใบสั่งขาย', icon: ShoppingCart, path: '/adminb2b/sales-orders', color: 'bg-blue-600', badge: null },
  { id: 'orders', label: 'ออเดอร์', icon: ClipboardList, path: '/adminb2b/orders', color: 'bg-sky-600', badge: null },
  { id: 'products', label: 'สินค้า', icon: Package, path: '/adminb2b/products', color: 'bg-emerald-500', badge: null },
  { id: 'categories', label: 'หมวดหมู่', icon: Tags, path: '/adminb2b/categories', color: 'bg-lime-600', badge: null },
  { id: 'projects', label: 'โครงการ', icon: Building2, path: '/adminb2b/projects', color: 'bg-green-500', badge: null },
  { id: 'tasks', label: 'งานติดตาม', icon: CheckSquare, path: '/adminb2b/tasks', color: 'bg-pink-500', badge: null },
  { id: 'approvals', label: 'อนุมัติ', icon: ClipboardCheck, path: '/adminb2b/approvals', color: 'bg-fuchsia-600', badge: null },
  { id: 'forecast', label: 'คาดการณ์', icon: TrendingUp, path: '/adminb2b/forecast', color: 'bg-teal-500', badge: null },
  { id: 'reports', label: 'รายงาน', icon: PieChart, path: '/adminb2b/reports', color: 'bg-indigo-500', badge: null },
  { id: 'admins', label: 'ผู้ดูแลระบบ', icon: UserCog, path: '/adminb2b/admins', color: 'bg-slate-600', badge: null },
  { id: 'permissions', label: 'สิทธิ์การใช้งาน', icon: Shield, path: '/adminb2b/permissions', color: 'bg-slate-700', badge: null },
  { id: 'line-bot', label: 'LINE Bot', icon: MessageSquare, path: '/adminb2b/line-bot', color: 'bg-green-600', badge: null },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/adminb2b/settings', color: 'bg-gray-500', badge: null },
];
