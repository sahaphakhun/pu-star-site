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
export function calculateCustomerAnalytics(orders: any[]): CustomerAnalytics {
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
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
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
 * อัปเดตสถิติลูกค้าจากออเดอร์จริง (ไม่ใช้ข้อมูลที่บันทึกใน User model)
 */
export async function updateCustomerStatsFromOrders(userId: string) {
  try {
    const { default: User } = await import('@/models/User');
    
    // ดึงสถิติจากออเดอร์จริง
    const statsFromOrders = await getCustomerStatsFromOrders(userId);
    
    // อัปเดตข้อมูลลูกค้า
    await User.findByIdAndUpdate(userId, {
      $set: {
        customerType: statsFromOrders.customerType,
        totalOrders: statsFromOrders.totalOrders,
        totalSpent: statsFromOrders.totalSpent,
        averageOrderValue: statsFromOrders.averageOrderValue,
        lastOrderDate: statsFromOrders.lastOrderDate,
      }
    });

    console.log(`Updated customer stats from orders for user ${userId}:`, statsFromOrders);
    
    return statsFromOrders;
  } catch (error) {
    console.error(`Error updating customer stats from orders for user ${userId}:`, error);
    throw error;
  }
}

/**
 * อัปเดตสถิติลูกค้าอัตโนมัติเมื่อมีการเปลี่ยนแปลงออเดอร์
 */
export async function updateCustomerStatsAutomatically(userId: string) {
  try {
    const { default: User } = await import('@/models/User');
    
    // ใช้ getCustomerStatsFromOrders เพื่อดึงสถิติจากออเดอร์จริงทั้งหมด
    const statsFromOrders = await getCustomerStatsFromOrders(userId);
    
    // อัปเดตข้อมูลลูกค้า
    await User.findByIdAndUpdate(userId, {
      $set: {
        customerType: statsFromOrders.customerType,
        totalOrders: statsFromOrders.totalOrders,
        totalSpent: statsFromOrders.totalSpent,
        averageOrderValue: statsFromOrders.averageOrderValue,
        lastOrderDate: statsFromOrders.lastOrderDate,
      }
    });

    console.log(`Updated customer stats for user ${userId}:`, {
      totalOrders: statsFromOrders.totalOrders,
      totalSpent: statsFromOrders.totalSpent,
      customerType: statsFromOrders.customerType
    });

  } catch (error) {
    console.error(`Error updating customer stats for user ${userId}:`, error);
    throw error;
  }
}

/**
 * ฟังก์ชันใหม่: อัปเดตสถิติลูกค้าทั้งหมดจากออเดอร์จริง (แก้ไขปัญหาหลัก)
 */
export async function forceUpdateAllCustomerStatsFromOrders() {
  try {
    const { default: User } = await import('@/models/User');
    const { default: Order } = await import('@/models/Order');

    console.log('Starting force update of all customer stats from orders...');
    
    // ดึงลูกค้าทั้งหมด
    const customers = await User.find({ role: 'user' }).select('_id phoneNumber').lean();
    console.log(`Found ${customers.length} customers to force update`);

    let updatedCount = 0;
    let errorCount = 0;
    let totalOrdersFound = 0;

    for (const customer of customers) {
      try {
        // ดึงออเดอร์ทั้งหมดของลูกค้า (รวมถึงออเดอร์เก่าที่อาจมี userId หรือไม่มี)
        const customerPhone = customer.phoneNumber;
        
        // สร้างรูปแบบเบอร์โทรที่ตรงกัน (รองรับทั้ง +66 และ 0)
        const phonePatterns = [];
        if (customerPhone.startsWith('+66')) {
          const numberWithoutPrefix = customerPhone.substring(3);
          phonePatterns.push(customerPhone, `0${numberWithoutPrefix}`);
        } else if (customerPhone.startsWith('0')) {
          const numberWithoutPrefix = customerPhone.substring(1);
          phonePatterns.push(customerPhone, `+66${numberWithoutPrefix}`);
        } else if (customerPhone.startsWith('66')) {
          const numberWithoutPrefix = customerPhone.substring(2);
          phonePatterns.push(`+${customerPhone}`, `0${numberWithoutPrefix}`);
        }

        // ดึงออเดอร์ทั้งหมดที่มีเบอร์ตรงกัน
        const allOrders = await Order.find({
          customerPhone: { $in: phonePatterns }
        }).sort({ createdAt: 1 }).lean();

        if (allOrders.length > 0) {
          // อัปเดต userId ในออเดอร์ที่ยังไม่มี
          const ordersToUpdate = allOrders.filter(order => !order.userId);
          if (ordersToUpdate.length > 0) {
            await Order.updateMany(
              { _id: { $in: ordersToUpdate.map(o => o._id) } },
              { $set: { userId: customer._id } }
            );
            console.log(`Updated ${ordersToUpdate.length} orders for user ${customer._id}`);
          }

          // คำนวณสถิติจากออเดอร์ทั้งหมด
          const analytics = calculateCustomerAnalytics(allOrders);
          const customerType = classifyCustomer(analytics);

          // อัปเดตข้อมูลลูกค้า
          await User.findByIdAndUpdate(customer._id, {
            $set: {
              customerType,
              totalOrders: analytics.totalOrders,
              totalSpent: analytics.totalSpent,
              averageOrderValue: analytics.averageOrderValue,
              lastOrderDate: analytics.lastOrderDate,
            }
          });

          totalOrdersFound += allOrders.length;
          updatedCount++;
          
          console.log(`Force updated customer ${customer._id}: ${analytics.totalOrders} orders, ฿${analytics.totalSpent}`);
        } else {
          // หากไม่มีออเดอร์ ให้รีเซ็ตสถิติ
          await User.findByIdAndUpdate(customer._id, {
            $set: {
              totalOrders: 0,
              totalSpent: 0,
              averageOrderValue: 0,
              lastOrderDate: null,
              customerType: 'new'
            }
          });
          updatedCount++;
        }
        
        // แสดงความคืบหน้าทุก 50 รายการ
        if (updatedCount % 50 === 0) {
          console.log(`Force updated ${updatedCount}/${customers.length} customers...`);
        }
      } catch (error) {
        console.error(`Failed to force update customer ${customer._id}:`, error);
        errorCount++;
      }
    }

    console.log(`Force update completed: ${updatedCount} successful, ${errorCount} failed, ${totalOrdersFound} total orders found`);
    
    return {
      success: true,
      total: customers.length,
      updated: updatedCount,
      failed: errorCount,
      totalOrdersFound
    };

  } catch (error) {
    console.error('Error in force update all customer stats:', error);
    throw error;
  }
}

/**
 * ดึงสถิติลูกค้าจากออเดอร์จริง (ไม่ใช้ข้อมูลที่บันทึกใน User model)
 */
export async function getCustomerStatsFromOrders(userId: string) {
  try {
    const { default: Order } = await import('@/models/Order');
    const { default: User } = await import('@/models/User');
    
    // ดึงข้อมูลลูกค้าเพื่อใช้เบอร์โทรในการค้นหา
    const user = await User.findById(userId).select('phoneNumber').lean();
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // สร้างรูปแบบเบอร์โทรที่ตรงกัน (รองรับทั้ง +66 และ 0)
    const phonePatterns = [];
    const customerPhone = user.phoneNumber;
    
    if (customerPhone.startsWith('+66')) {
      const numberWithoutPrefix = customerPhone.substring(3);
      phonePatterns.push(customerPhone, `0${numberWithoutPrefix}`);
    } else if (customerPhone.startsWith('0')) {
      const numberWithoutPrefix = customerPhone.substring(1);
      phonePatterns.push(customerPhone, `+66${numberWithoutPrefix}`);
    } else if (customerPhone.startsWith('66')) {
      const numberWithoutPrefix = customerPhone.substring(2);
      phonePatterns.push(`+${customerPhone}`, `0${numberWithoutPrefix}`);
    }
    
    // ดึงออเดอร์ทั้งหมดของลูกค้า (รวมถึงออเดอร์เก่าที่อาจมี userId หรือไม่มี)
    const orders = await Order.find({
      $or: [
        { userId: userId },
        { customerPhone: { $in: phonePatterns } }
      ]
    }).sort({ createdAt: 1 }).lean();
    
    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        customerType: 'new'
      };
    }
    
    // อัปเดต userId ในออเดอร์ที่ยังไม่มี
    const ordersToUpdate = orders.filter(order => !order.userId);
    if (ordersToUpdate.length > 0) {
      await Order.updateMany(
        { _id: { $in: ordersToUpdate.map(o => o._id) } },
        { $set: { userId: userId } }
      );
      console.log(`Updated ${ordersToUpdate.length} orders with userId for user ${userId}`);
    }
    
    // คำนวณสถิติจากออเดอร์จริง
    const analytics = calculateCustomerAnalytics(orders);
    const customerType = classifyCustomer(analytics);
    
    return {
      ...analytics,
      customerType
    };
  } catch (error) {
    console.error(`Error getting customer stats from orders for user ${userId}:`, error);
    throw error;
  }
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
export async function generateCustomerStats(customers: IUser[]) {
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => c.customerType === 'new').length;
  const regularCustomers = customers.filter(c => c.customerType === 'regular').length;
  const targetCustomers = customers.filter(c => c.customerType === 'target').length;
  const inactiveCustomers = customers.filter(c => c.customerType === 'inactive').length;

  // คำนวณยอดรวมจากออเดอร์จริง
  let totalRevenue = 0;
  let totalOrderValues = 0;
  let validCustomers = 0;

  for (const customer of customers) {
    try {
      const statsFromOrders = await getCustomerStatsFromOrders((customer as any)._id.toString());
      totalRevenue += statsFromOrders.totalSpent || 0;
      if (statsFromOrders.totalOrders > 0) {
        totalOrderValues += statsFromOrders.averageOrderValue || 0;
        validCustomers++;
      }
    } catch (error) {
      console.error(`Error getting stats for customer ${(customer as any)._id}:`, error);
      // ใช้ข้อมูลจาก User model เป็น fallback
      totalRevenue += customer.totalSpent || 0;
      if ((customer.totalOrders || 0) > 0) {
        totalOrderValues += customer.averageOrderValue || 0;
        validCustomers++;
      }
    }
  }

  const averageOrderValue = validCustomers > 0 ? totalOrderValues / validCustomers : 0;

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

/**
 * ซิงค์ออเดอร์ที่มีเบอร์ตรงกันเข้ามาเป็นของผู้ใช้คนนั้น
 * รองรับเบอร์สองรูปแบบ: +66xxxxxxxxx และ 0xxxxxxxxx
 */
export async function syncOrdersToUser(userId: string, userPhoneNumber: string) {
  try {
    // Import models dynamically เพื่อหลีกเลี่ยง circular dependency
    const { default: Order } = await import('@/models/Order');
    const { default: User } = await import('@/models/User');

    // สร้างรูปแบบเบอร์โทรที่ตรงกัน (รองรับทั้ง +66 และ 0)
    const phonePatterns = [];
    
    // หากเบอร์เริ่มต้นด้วย +66
    if (userPhoneNumber.startsWith('+66')) {
      const numberWithoutPrefix = userPhoneNumber.substring(3);
      phonePatterns.push(
        userPhoneNumber, // +66xxxxxxxxx
        `0${numberWithoutPrefix}` // 0xxxxxxxxx
      );
    }
    // หากเบอร์เริ่มต้นด้วย 0
    else if (userPhoneNumber.startsWith('0')) {
      const numberWithoutPrefix = userPhoneNumber.substring(1);
      phonePatterns.push(
        userPhoneNumber, // 0xxxxxxxxx
        `+66${numberWithoutPrefix}` // +66xxxxxxxxx
      );
    }
    // หากเบอร์เริ่มต้นด้วย 66
    else if (userPhoneNumber.startsWith('66')) {
      const numberWithoutPrefix = userPhoneNumber.substring(2);
      phonePatterns.push(
        `+${userPhoneNumber}`, // +66xxxxxxxxx
        `0${numberWithoutPrefix}` // 0xxxxxxxxx
      );
    }

    console.log(`Phone patterns for ${userPhoneNumber}:`, phonePatterns);

    // ดึงออเดอร์ที่มีเบอร์ตรงกันและยังไม่มี userId
    const ordersToSync = await Order.find({
      customerPhone: { $in: phonePatterns },
      userId: { $exists: false } // ออเดอร์ที่ยังไม่มี userId
    }).sort({ createdAt: 1 }).lean() as any[];

    console.log(`Found ${ordersToSync.length} orders to sync for user ${userId}`);

    if (ordersToSync.length === 0) {
      return {
        success: true,
        message: 'ไม่มีออเดอร์ใหม่ที่ต้องซิงค์',
        syncedOrders: 0,
        totalOrders: 0
      };
    }

    // ตรวจสอบออเดอร์ซ้ำโดยใช้ orderId หรือข้อมูลเฉพาะ
    const syncedOrderIds = new Set();
    let syncedCount = 0;
    let duplicateCount = 0;

    for (const order of ordersToSync) {
      try {
        // สร้าง unique key สำหรับตรวจสอบออเดอร์ซ้ำ
        const orderKey = `${order.customerPhone}_${order.totalAmount}_${new Date(order.createdAt).toISOString().split('T')[0]}`;
        
        if (syncedOrderIds.has(orderKey)) {
          console.log(`Skipping duplicate order: ${order._id} (${orderKey})`);
          duplicateCount++;
          continue;
        }

        // อัปเดตออเดอร์ให้มี userId
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            userId: userId,
            // อัปเดตข้อมูลลูกค้าให้ตรงกับข้อมูลในระบบ
            customerName: order.customerName || 'ลูกค้า'
          }
        });

        syncedOrderIds.add(orderKey);
        syncedCount++;

        console.log(`Synced order ${order._id} to user ${userId}`);

      } catch (error) {
        console.error(`Failed to sync order ${order._id}:`, error);
      }
    }

    // อัปเดตสถิติลูกค้าหลังจากซิงค์ออเดอร์
    if (syncedCount > 0) {
      await updateCustomerStatsFromOrders(userId);
      console.log(`Updated customer stats after syncing ${syncedCount} orders`);
    }

    return {
      success: true,
      message: `ซิงค์ออเดอร์สำเร็จ ${syncedCount} รายการ`,
      syncedOrders: syncedCount,
      duplicateOrders: duplicateCount,
      totalOrders: ordersToSync.length
    };

  } catch (error) {
    console.error(`Error syncing orders for user ${userId}:`, error);
    throw error;
  }
}

 

/**
 * ซิงค์ออเดอร์ทั้งหมดในระบบให้ตรงกับผู้ใช้ (แบบครอบคลุม)
 * รวมถึงออเดอร์ที่มี userId แล้วแต่ข้อมูลอาจไม่ถูกต้อง
 */
export async function syncAllOrdersToUsersComprehensive() {
  try {
    const { default: User } = await import('@/models/User');
    const { default: Order } = await import('@/models/Order');

    console.log('Starting comprehensive bulk order sync...');
    
    // ดึงผู้ใช้ทั้งหมด
    const users = await User.find({ role: 'user' }).select('_id phoneNumber').lean();
    console.log(`Found ${users.length} users to sync orders`);

    let totalSynced = 0;
    let totalDuplicates = 0;
    let totalCorrected = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const userPhone = user.phoneNumber;
        
        // สร้างรูปแบบเบอร์โทรที่ตรงกัน
        const phonePatterns = [];
        if (userPhone.startsWith('+66')) {
          const numberWithoutPrefix = userPhone.substring(3);
          phonePatterns.push(userPhone, `0${numberWithoutPrefix}`);
        } else if (userPhone.startsWith('0')) {
          const numberWithoutPrefix = userPhone.substring(1);
          phonePatterns.push(userPhone, `+66${numberWithoutPrefix}`);
        } else if (userPhone.startsWith('66')) {
          const numberWithoutPrefix = userPhone.substring(2);
          phonePatterns.push(`+${userPhone}`, `0${numberWithoutPrefix}`);
        }

        // ดึงออเดอร์ทั้งหมดที่มีเบอร์ตรงกัน
        const allOrders = await Order.find({
          customerPhone: { $in: phonePatterns }
        }).sort({ createdAt: 1 }).lean();

        let syncedCount = 0;
        let correctedCount = 0;

        for (const order of allOrders) {
          try {
            // ตรวจสอบว่าออเดอร์นี้ควรเป็นของ user นี้หรือไม่
            if (!order.userId) {
              // ออเดอร์ที่ยังไม่มี userId
              await Order.findByIdAndUpdate(order._id, {
                $set: { userId: user._id }
              });
              syncedCount++;
              console.log(`Synced order ${order._id} to user ${user._id}`);
            } else if (order.userId.toString() !== user._id.toString()) {
              // ออเดอร์ที่มี userId แล้วแต่ไม่ตรงกับ user นี้
              // ตรวจสอบว่า userId ปัจจุบันมีอยู่จริงหรือไม่
              const currentUser = await User.findById(order.userId).lean();
              if (!currentUser) {
                // userId ไม่มีอยู่จริง ให้ย้ายมาที่ user นี้
                await Order.findByIdAndUpdate(order._id, {
                  $set: { userId: user._id }
                });
                correctedCount++;
                console.log(`Corrected order ${order._id} from invalid userId to user ${user._id}`);
              }
            }
          } catch (error) {
            console.error(`Failed to process order ${order._id}:`, error);
          }
        }

        totalSynced += syncedCount;
        totalCorrected += correctedCount;
        
        if (syncedCount > 0 || correctedCount > 0) {
          console.log(`User ${userPhone}: synced ${syncedCount}, corrected ${correctedCount} orders`);
        }
        
      } catch (error) {
        console.error(`Failed to sync orders for user ${user._id}:`, error);
        errorCount++;
      }
    }

    // อัปเดตสถิติลูกค้าทั้งหมดหลังซิงค์เสร็จ
    if (totalSynced > 0 || totalCorrected > 0) {
      console.log('Updating all customer stats after comprehensive sync...');
      await forceUpdateAllCustomerStatsFromOrders();
    }

    console.log(`Comprehensive order sync completed: ${totalSynced} synced, ${totalCorrected} corrected, ${errorCount} errors`);
    
    return {
      success: true,
      totalUsers: users.length,
      syncedOrders: totalSynced,
      correctedOrders: totalCorrected,
      errors: errorCount
    };

  } catch (error) {
    console.error('Error in comprehensive bulk order sync:', error);
    throw error;
  }
} 

/**
 * ดึงออเดอร์ทั้งหมดและหาผู้ใช้ที่สั่งซื้อ (มองกลับกัน)
 * ฟังก์ชันนี้จะช่วยค้นหาออเดอร์ที่ยังไม่มี userId และสร้างผู้ใช้ใหม่
 */
export async function findOrphanedOrdersAndCreateUsers() {
  try {
    const { default: User } = await import('@/models/User');
    const { default: Order } = await import('@/models/Order');

    console.log('🔍 เริ่มต้นค้นหาออเดอร์ที่ไม่มีผู้ใช้...');
    
    // ดึงออเดอร์ทั้งหมดที่ไม่มี userId
    const orphanedOrders = await Order.find({
      userId: { $exists: false }
    }).sort({ createdAt: 1 }).lean();

    console.log(`พบออเดอร์ที่ไม่มี userId: ${orphanedOrders.length} รายการ`);

    if (orphanedOrders.length === 0) {
      return {
        success: true,
        message: 'ไม่พบออเดอร์ที่ไม่มีผู้ใช้',
        createdUsers: 0,
        syncedOrders: 0,
        skippedOrders: 0
      };
    }

    let createdUsers = 0;
    let syncedOrders = 0;
    let skippedOrders = 0;
    const processedPhones = new Set();

    for (const order of orphanedOrders) {
      try {
        const customerPhone = order.customerPhone;
        
        // ข้ามหากเบอร์โทรซ้ำหรือไม่มีเบอร์โทร
        if (!customerPhone || processedPhones.has(customerPhone)) {
          skippedOrders++;
          continue;
        }

        // ตรวจสอบว่ามีผู้ใช้ที่มีเบอร์โทรนี้อยู่แล้วหรือไม่
        const existingUser = await User.findOne({
          phoneNumber: customerPhone
        }).lean();

        if (existingUser) {
          // มีผู้ใช้อยู่แล้ว ให้ซิงค์ออเดอร์
          await Order.findByIdAndUpdate(order._id, {
            $set: { userId: existingUser._id }
          });
          syncedOrders++;
          console.log(`📱 ซิงค์ออเดอร์ ${order._id} ให้ผู้ใช้ ${existingUser.phoneNumber}`);
        } else {
          // สร้างผู้ใช้ใหม่
          const newUser = new User({
            name: order.customerName || 'ลูกค้า',
            phoneNumber: customerPhone,
            email: order.customerEmail || '',
            role: 'user',
            customerType: 'new',
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
            createdAt: order.createdAt,
            updatedAt: new Date()
          });

          const savedUser = await newUser.save();
          
          // อัปเดตออเดอร์ให้มี userId
          await Order.findByIdAndUpdate(order._id, {
            $set: { userId: savedUser._id }
          });

          createdUsers++;
          syncedOrders++;
          processedPhones.add(customerPhone);
          
          console.log(`👤 สร้างผู้ใช้ใหม่: ${savedUser.phoneNumber} (${savedUser.name})`);
        }

      } catch (error) {
        console.error(`❌ ไม่สามารถประมวลผลออเดอร์ ${order._id}:`, error);
        skippedOrders++;
      }
    }

    // อัปเดตสถิติลูกค้าทั้งหมดหลังสร้างผู้ใช้ใหม่
    if (createdUsers > 0 || syncedOrders > 0) {
      console.log('📊 อัปเดตสถิติลูกค้าทั้งหมด...');
      await forceUpdateAllCustomerStatsFromOrders();
    }

    console.log(`✅ เสร็จสิ้น: สร้างผู้ใช้ ${createdUsers} คน, ซิงค์ออเดอร์ ${syncedOrders} รายการ, ข้าม ${skippedOrders} รายการ`);

    return {
      success: true,
      message: `สร้างผู้ใช้ ${createdUsers} คน, ซิงค์ออเดอร์ ${syncedOrders} รายการ`,
      createdUsers,
      syncedOrders,
      skippedOrders,
      totalOrphanedOrders: orphanedOrders.length
    };

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการค้นหาออเดอร์ที่ไม่มีผู้ใช้:', error);
    throw error;
  }
}

/**
 * ตรวจสอบและรายงานออเดอร์ที่ไม่มีผู้ใช้
 */
export async function reportOrphanedOrders() {
  try {
    const { default: Order } = await import('@/models/Order');

    console.log('📋 ตรวจสอบออเดอร์ที่ไม่มีผู้ใช้...');
    
    // ดึงออเดอร์ทั้งหมดที่ไม่มี userId
    const orphanedOrders = await Order.find({
      userId: { $exists: false }
    }).sort({ createdAt: 1 }).lean();

    console.log(`พบออเดอร์ที่ไม่มี userId: ${orphanedOrders.length} รายการ`);

    if (orphanedOrders.length === 0) {
      return {
        success: true,
        message: 'ไม่พบออเดอร์ที่ไม่มีผู้ใช้',
        orphanedOrders: [],
        summary: {
          totalOrphaned: 0,
          uniquePhones: 0,
          totalAmount: 0,
          dateRange: { earliest: null, latest: null }
        }
      };
    }

    // สรุปข้อมูล
    const uniquePhones = new Set(orphanedOrders.map(o => o.customerPhone)).size;
    const totalAmount = orphanedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const dates = orphanedOrders.map(o => new Date(o.createdAt)).sort();
    
    const summary = {
      totalOrphaned: orphanedOrders.length,
      uniquePhones,
      totalAmount,
      dateRange: {
        earliest: dates[0],
        latest: dates[dates.length - 1]
      }
    };

    // แสดงรายละเอียดออเดอร์
    console.log('\n📋 รายละเอียดออเดอร์ที่ไม่มีผู้ใช้:');
    console.log(`- จำนวนออเดอร์: ${summary.totalOrphaned}`);
    console.log(`- เบอร์โทรที่ไม่ซ้ำ: ${summary.uniquePhones}`);
    console.log(`- ยอดรวม: ฿${summary.totalAmount.toLocaleString()}`);
    console.log(`- ช่วงวันที่: ${summary.dateRange.earliest?.toLocaleDateString()} - ${summary.dateRange.latest?.toLocaleDateString()}`);

    // แสดงตัวอย่างออเดอร์
    const sampleOrders = orphanedOrders.slice(0, 10);
    console.log('\n📋 ตัวอย่างออเดอร์ (10 รายการแรก):');
    sampleOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.customerName || 'ไม่มีชื่อ'} - ${order.customerPhone} - ฿${order.totalAmount} - ${new Date(order.createdAt).toLocaleDateString()}`);
    });

    return {
      success: true,
      message: `พบออเดอร์ที่ไม่มีผู้ใช้ ${orphanedOrders.length} รายการ`,
      orphanedOrders: orphanedOrders.slice(0, 100), // ส่งกลับแค่ 100 รายการแรก
      summary
    };

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบออเดอร์ที่ไม่มีผู้ใช้:', error);
    throw error;
  }
} 