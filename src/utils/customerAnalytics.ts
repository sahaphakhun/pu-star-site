import { IUser } from '@/models/User';
import { IOrder } from '@/models/Order';

export interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number;
  orderFrequency: number; // ออเดอร์ต่อเดือน
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  regularCustomers: number;
  targetCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: {
    user: IUser;
    totalSpent: number;
    totalOrders: number;
  }[];
}

/**
 * คำนวณสถิติลูกค้าจากออเดอร์
 */
export function calculateCustomerAnalytics(orders: IOrder[]): CustomerAnalytics {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      daysSinceLastOrder: 0,
      orderFrequency: 0,
    };
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalSpent / totalOrders;
  
  // หาวันที่สั่งซื้อล่าสุด
  const lastOrderDate = orders.reduce((latest, order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate > latest ? orderDate : latest;
  }, new Date(0));

  // คำนวณจำนวนวันนับจากออเดอร์ล่าสุด
  const daysSinceLastOrder = Math.floor(
    (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // คำนวณความถี่ในการสั่งซื้อ (ออเดอร์ต่อเดือน)
  const firstOrderDate = orders.reduce((earliest, order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate < earliest ? orderDate : earliest;
  }, new Date());

  const monthsDiff = Math.max(1, 
    (lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const orderFrequency = totalOrders / monthsDiff;

  return {
    totalOrders,
    totalSpent,
    averageOrderValue,
    lastOrderDate,
    daysSinceLastOrder,
    orderFrequency,
  };
}

/**
 * จัดประเภทลูกค้าตามพฤติกรรมการซื้อ
 */
export function classifyCustomer(analytics: CustomerAnalytics): 'new' | 'regular' | 'target' | 'inactive' {
  const { totalOrders, totalSpent, daysSinceLastOrder, orderFrequency } = analytics;

  // ลูกค้าห่างหาย: ไม่สั่งซื้อมากกว่า 90 วัน
  if (daysSinceLastOrder > 90) {
    return 'inactive';
  }

  // ลูกค้าใหม่: สั่งซื้อไม่เกิน 2 ครั้งและยอดรวมไม่เกิน 5000 บาท
  if (totalOrders <= 2 && totalSpent <= 5000) {
    return 'new';
  }

  // ลูกค้าเป้าหมาย: สั่งซื้อบ่อย (มากกว่า 2 ครั้งต่อเดือน) หรือยอดสูง (มากกว่า 20000 บาท)
  if (orderFrequency > 2 || totalSpent > 20000) {
    return 'target';
  }

  // ลูกค้าประจำ: สั่งซื้อสม่ำเสมอแต่ไม่ถึงเกณฑ์เป้าหมาย
  return 'regular';
}

/**
 * อัปเดตสถิติลูกค้าในฐานข้อมูล
 */
export async function updateCustomerStats(userId: string, orders: IOrder[]) {
  const analytics = calculateCustomerAnalytics(orders);
  const customerType = classifyCustomer(analytics);

  return {
    customerType,
    totalOrders: analytics.totalOrders,
    totalSpent: analytics.totalSpent,
    averageOrderValue: analytics.averageOrderValue,
    lastOrderDate: analytics.lastOrderDate,
  };
}

/**
 * กรองลูกค้าตามเงื่อนไข
 */
export function filterCustomers(
  customers: IUser[],
  filters: {
    customerType?: string;
    assignedTo?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    minSpent?: number;
    maxSpent?: number;
    searchTerm?: string;
  }
): IUser[] {
  return customers.filter(customer => {
    // กรองตามประเภทลูกค้า
    if (filters.customerType && customer.customerType !== filters.customerType) {
      return false;
    }

    // กรองตามผู้รับผิดชอบ
    if (filters.assignedTo && customer.assignedTo !== filters.assignedTo) {
      return false;
    }

    // กรองตามช่วงวันที่
    if (filters.dateRange && customer.lastOrderDate) {
      const orderDate = new Date(customer.lastOrderDate);
      if (orderDate < filters.dateRange.start || orderDate > filters.dateRange.end) {
        return false;
      }
    }

    // กรองตามยอดซื้อ
    if (filters.minSpent && (customer.totalSpent || 0) < filters.minSpent) {
      return false;
    }
    if (filters.maxSpent && (customer.totalSpent || 0) > filters.maxSpent) {
      return false;
    }

    // กรองตามคำค้นหา (ชื่อ, เบอร์โทร, อีเมล)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchName = customer.name ? customer.name.toLowerCase().includes(searchLower) : false;
      const matchPhone = customer.phoneNumber ? customer.phoneNumber.includes(searchLower) : false;
      const matchEmail = customer.email ? customer.email.toLowerCase().includes(searchLower) : false;
      
      if (!matchName && !matchPhone && !matchEmail) {
        return false;
      }
    }

    return true;
  });
}

/**
 * สร้างรายงานสถิติลูกค้ารวม
 */
export function generateCustomerStats(customers: IUser[]): CustomerStats {
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => c.customerType === 'new').length;
  const regularCustomers = customers.filter(c => c.customerType === 'regular').length;
  const targetCustomers = customers.filter(c => c.customerType === 'target').length;
  const inactiveCustomers = customers.filter(c => c.customerType === 'inactive').length;

  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const averageOrderValue = totalCustomers > 0 ? 
    customers.reduce((sum, c) => sum + (c.averageOrderValue || 0), 0) / totalCustomers : 0;

  // ลูกค้าท็อป 10
  const topCustomers = customers
    .filter(c => c.totalSpent && c.totalSpent > 0)
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 10)
    .map(user => ({
      user,
      totalSpent: user.totalSpent || 0,
      totalOrders: user.totalOrders || 0,
    }));

  return {
    totalCustomers,
    newCustomers,
    regularCustomers,
    targetCustomers,
    inactiveCustomers,
    totalRevenue,
    averageOrderValue,
    topCustomers,
  };
}

/**
 * คำนวณเปอร์เซ็นต์การเติบโต
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * สร้างข้อมูลสำหรับ export CSV
 */
export function prepareCustomerDataForExport(customers: IUser[]) {
  return customers.map(customer => ({
    'ชื่อ': customer.name || 'ลูกค้า',
    'เบอร์โทรศัพท์': customer.phoneNumber || '-',
    'อีเมล': customer.email || '-',
    'ประเภทลูกค้า': getCustomerTypeLabel(customer.customerType),
    'ผู้รับผิดชอบ': customer.assignedTo || '-',
    'เลขผู้เสียภาษี': customer.taxId || '-',
    'จำนวนออเดอร์': customer.totalOrders || 0,
    'ยอดซื้อรวม': customer.totalSpent || 0,
    'ค่าเฉลี่ยต่อออเดอร์': customer.averageOrderValue || 0,
    'วันที่สั่งซื้อล่าสุด': customer.lastOrderDate ? 
      new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : '-',
    'วันที่สมัครสมาชิก': customer.createdAt ? 
      new Date(customer.createdAt).toLocaleDateString('th-TH') : '-',
  }));
}

/**
 * แปลงประเภทลูกค้าเป็นภาษาไทย
 */
export function getCustomerTypeLabel(type?: string): string {
  switch (type) {
    case 'new': return 'ลูกค้าใหม่';
    case 'regular': return 'ลูกค้าประจำ';
    case 'target': return 'ลูกค้าเป้าหมาย';
    case 'inactive': return 'ลูกค้าห่างหาย';
    default: return 'ไม่ระบุ';
  }
}

/**
 * สร้างสีสำหรับแต่ละประเภทลูกค้า
 */
export function getCustomerTypeColor(type?: string): string {
  switch (type) {
    case 'new': return 'bg-green-100 text-green-800';
    case 'regular': return 'bg-blue-100 text-blue-800';
    case 'target': return 'bg-yellow-100 text-yellow-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
} 