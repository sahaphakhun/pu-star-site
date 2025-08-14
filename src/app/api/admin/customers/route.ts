import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import {
  filterCustomers,
  generateCustomerStats,
  updateCustomerStats,
  prepareCustomerDataForExport,
  updateCustomerStatsAutomatically,
  updateAllCustomerStats,
  syncOrdersToUser,
  syncAllOrdersToUsers,
} from '@/utils/customerAnalytics';
import { syncUserNameFromFirstOrder, migrateAllUserNamesFromOrders } from '@/utils/userNameSync';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GET /api/admin/customers');
    
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    console.log('Auth result:', authResult);

    if (!authResult || !authResult.valid) {
      console.log('Authentication failed');
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเข้าสู่ระบบ' }, { status: 401 });
    }
    
    if (authResult.decoded?.role !== 'admin') {
      console.log('User role:', authResult.decoded?.role);
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็นแอดมิน' }, { status: 403 });
    }

    console.log('Connecting to DB...');
    await connectDB();
    console.log('DB connected successfully');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const customerType = searchParams.get('customerType') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const export_format = searchParams.get('export');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minSpent = searchParams.get('minSpent');
    const maxSpent = searchParams.get('maxSpent');
    const includeAdminsParam = searchParams.get('includeAdmins');
    const includeAdmins = includeAdminsParam === '1' || includeAdminsParam === 'true';
    const dateField = (searchParams.get('dateField') || 'lastOrderDate') as 'createdAt' | 'lastOrderDate';

    console.log('Query params:', {
      page,
      limit,
      customerType,
      assignedTo,
      searchTerm,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      minSpent,
      maxSpent,
      includeAdmins,
      dateField,
    });

    // สร้างเงื่อนไขการค้นหา
    const filters: any = {};
    
    // เฉพาะลูกค้า (ไม่ใช่ admin) หากไม่ได้ระบุให้รวมแอดมินด้วย
    if (!includeAdmins) {
      filters.role = 'user';
    }
    
    if (customerType) {
      filters.customerType = customerType;
      console.log('Adding customerType filter:', customerType);
    }
    
    if (assignedTo) {
      filters.assignedTo = assignedTo;
      console.log('Adding assignedTo filter:', assignedTo);
    }
    
    if (searchTerm) {
      filters.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
      console.log('Adding search filter:', searchTerm);
    }
    
    if (startDate && endDate) {
      // ใช้เวลาไทย (UTC+7) ให้ครอบคลุมทั้งวัน
      const start = new Date(`${startDate}T00:00:00+07:00`);
      const end = new Date(`${endDate}T23:59:59+07:00`);
      if (dateField === 'createdAt') {
        filters.createdAt = { $gte: start, $lte: end } as any;
      } else {
        filters.lastOrderDate = { $gte: start, $lte: end } as any;
      }
      console.log('Adding date filter:', startDate, 'to', endDate, 'field:', dateField);
    }
    
    if (minSpent) {
      filters.totalSpent = { ...filters.totalSpent, $gte: parseInt(minSpent) };
      console.log('Adding minSpent filter:', minSpent);
    }
    
    if (maxSpent) {
      filters.totalSpent = { ...filters.totalSpent, $lte: parseInt(maxSpent) };
      console.log('Adding maxSpent filter:', maxSpent);
    }

    // สร้างการเรียงลำดับ
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // ดึงข้อมูลลูกค้า
    console.log('Final filters:', JSON.stringify(filters, null, 2));
    console.log('Sort options:', sortOptions);
    
    // ตรวจสอบจำนวนผู้ใช้ทั้งหมดในฐานข้อมูล
    const allUsersCount = await User.countDocuments({});
    const userRoleCount = await User.countDocuments({ role: 'user' });
    console.log('Total users in DB:', allUsersCount);
    console.log('Users with role "user":', userRoleCount);
    
    // ตรวจสอบข้อมูลตัวอย่าง
    const sampleUsers = await User.find({ role: 'user' }).limit(3).select('name phoneNumber customerType role').lean();
    console.log('Sample users:', sampleUsers);
    
    let customers;
    let totalCustomers;
    let totalPages;
    
    try {
      customers = await User.find(filters)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password') // ไม่เอาฟิลด์ password
        .lean();
        
      console.log('Found customers:', customers.length);
      console.log('Customer sample:', customers.slice(0, 2));

      totalCustomers = await User.countDocuments(filters);
      totalPages = Math.ceil(totalCustomers / limit);
      
      console.log('Total customers matching filters:', totalCustomers);
      console.log('Total pages:', totalPages);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // หากต้องการ export
    if (export_format === 'csv') {
      try {
        const allCustomers = await User.find(filters).sort(sortOptions).lean();
        const csvData = prepareCustomerDataForExport(allCustomers);
        
        return NextResponse.json({
          success: true,
          data: csvData,
          export: true
        });
      } catch (exportError) {
        console.error('Export error:', exportError);
        return NextResponse.json(
          { 
            error: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล',
            details: exportError instanceof Error ? exportError.message : 'Unknown export error'
          },
          { status: 500 }
        );
      }
    }

    // สร้างสถิติรวม
    const allCustomersForStats = await User.find(includeAdmins ? {} : { role: 'user' })
      .select('-password')
      .lean();
    console.log('All customers for stats:', allCustomersForStats.length);
    
    let stats;
    try {
      stats = generateCustomerStats(allCustomersForStats);
      console.log('Generated stats:', stats);
    } catch (statsError) {
      console.error('Error generating stats:', statsError);
      // สร้าง stats แบบพื้นฐานหากเกิดข้อผิดพลาด
      stats = {
        totalCustomers: allCustomersForStats.length,
        newCustomers: 0,
        regularCustomers: 0,
        targetCustomers: 0,
        inactiveCustomers: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topCustomers: []
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCustomers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ต้องระบุ userId' }, { status: 400 });
    }

    // อัปเดตข้อมูลลูกค้า
    const customer = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

// API สำหรับอัปเดตสถิติลูกค้าทั้งหมด (ใช้เป็น cron job)
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { action, customerId, customerName } = await request.json();

    if (action === 'updateAllCustomerStats') {
      try {
        console.log('Starting bulk customer stats update...');
        const result = await updateAllCustomerStats();
        
        return NextResponse.json({
          success: true,
          message: `อัปเดตสถิติลูกค้าเรียบร้อยแล้ว ${result.updated} จาก ${result.total} คน`,
          data: result
        });
      } catch (error) {
        console.error('Error updating all customer stats:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการอัปเดตสถิติลูกค้าทั้งหมด',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'updateCustomerStatsById') {
      try {
        const { customerId } = await request.json();
        
        if (!customerId) {
          return NextResponse.json({ error: 'ต้องระบุ customerId' }, { status: 400 });
        }

        await updateCustomerStatsAutomatically(customerId);
        
        // ดึงข้อมูลลูกค้าที่อัปเดตแล้ว
        const updatedCustomer = await User.findById(customerId).lean();
        
        return NextResponse.json({
          success: true,
          message: 'อัปเดตสถิติลูกค้าสำเร็จแล้ว',
          customer: updatedCustomer
        });
      } catch (error) {
        console.error('Error updating customer stats:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการอัปเดตสถิติลูกค้า',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'syncCustomerName') {
      if (!customerId) {
        return NextResponse.json({ error: 'ต้องระบุ customerId' }, { status: 400 });
      }

      try {
        const result = await syncUserNameFromFirstOrder(customerId);
        if (result) {
          // ดึงข้อมูลลูกค้าที่อัปเดตแล้ว
          const updatedCustomer = await User.findById(customerId).lean();
          return NextResponse.json({
            success: true,
            message: 'ซิงค์ชื่อลูกค้าสำเร็จแล้ว',
            customer: updatedCustomer
          });
        } else {
          return NextResponse.json({
            success: false,
            message: 'ไม่สามารถซิงค์ชื่อลูกค้าได้ (อาจไม่มีออเดอร์หรือชื่อถูกต้องแล้ว)'
          });
        }
      } catch (error) {
        console.error('Error syncing customer name:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการซิงค์ชื่อลูกค้า'
        }, { status: 500 });
      }
    }

    if (action === 'syncAllCustomerNames') {
      try {
        const result = await migrateAllUserNamesFromOrders();
        return NextResponse.json({
          success: true,
          message: `ซิงค์ชื่อลูกค้าสำเร็จ ${result.updated} จาก ${result.total} คน`,
          updated: result.updated,
          total: result.total
        });
      } catch (error) {
        console.error('Error syncing all customer names:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการซิงค์ชื่อลูกค้าทั้งหมด'
        }, { status: 500 });
      }
    }

    if (action === 'syncOrdersToUser') {
      try {
        const { customerId } = await request.json();
        
        if (!customerId) {
          return NextResponse.json({ error: 'ต้องระบุ customerId' }, { status: 400 });
        }

        // ดึงข้อมูลลูกค้า
        const customer = await User.findById(customerId).lean();
        if (!customer) {
          return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
        }

        const result = await syncOrdersToUser(customerId, customer.phoneNumber);
        
        return NextResponse.json({
          success: true,
          message: result.message,
          data: result
        });
      } catch (error) {
        console.error('Error syncing orders to user:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการซิงค์ออเดอร์',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'syncAllOrdersToUsers') {
      try {
        console.log('Starting bulk order sync...');
        const result = await syncAllOrdersToUsers();
        
        return NextResponse.json({
          success: true,
          message: `ซิงค์ออเดอร์สำเร็จ ${result.syncedOrders} รายการ จาก ${result.totalUsers} คน`,
          data: result
        });
      } catch (error) {
        console.error('Error syncing all orders to users:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการซิงค์ออเดอร์ทั้งหมด',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'getCustomersByIds') {
      try {
        const { userIds } = await request.json();
        
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json({ error: 'ต้องระบุ userIds เป็น array' }, { status: 400 });
        }

        const customers = await User.find({ 
          _id: { $in: userIds },
          role: 'user'
        }).select('_id name phoneNumber customerType').lean();

        return NextResponse.json({
          success: true,
          customers
        });
      } catch (error) {
        console.error('Error getting customers by IDs:', error);
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Action ไม่ถูกต้อง' }, { status: 400 });

  } catch (error) {
    console.error('Error in customer POST:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดำเนินการ' },
      { status: 500 }
    );
  }
} 