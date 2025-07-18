import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { 
  filterCustomers, 
  generateCustomerStats, 
  updateCustomerStats,
  prepareCustomerDataForExport 
} from '@/utils/customerAnalytics';

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

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

    // สร้างเงื่อนไขการค้นหา
    const filters: any = {};
    
    if (customerType) filters.customerType = customerType;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (searchTerm) {
      filters.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      filters.lastOrderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (minSpent) filters.totalSpent = { ...filters.totalSpent, $gte: parseInt(minSpent) };
    if (maxSpent) filters.totalSpent = { ...filters.totalSpent, $lte: parseInt(maxSpent) };

    // เฉพาะลูกค้า (ไม่ใช่ admin)
    filters.role = 'user';

    // สร้างการเรียงลำดับ
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // ดึงข้อมูลลูกค้า
    const customers = await User.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalCustomers = await User.countDocuments(filters);
    const totalPages = Math.ceil(totalCustomers / limit);

    // หากต้องการ export
    if (export_format === 'csv') {
      const allCustomers = await User.find(filters).sort(sortOptions).lean();
      const csvData = prepareCustomerDataForExport(allCustomers);
      
      return NextResponse.json({
        success: true,
        data: csvData,
        export: true
      });
    }

    // สร้างสถิติรวม
    const allCustomersForStats = await User.find({ role: 'user' }).lean();
    const stats = generateCustomerStats(allCustomersForStats);

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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
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
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { action } = await request.json();

    if (action === 'updateAllCustomerStats') {
      // ดึงลูกค้าทั้งหมด
      const customers = await User.find({ role: 'user' }).lean();
      let updatedCount = 0;

      for (const customer of customers) {
        // ดึงออเดอร์ของลูกค้า
        const orders = await Order.find({ 
          userId: customer._id,
          status: { $in: ['delivered', 'confirmed', 'shipped'] }
        }).lean();

        if (orders.length > 0) {
          const stats = await updateCustomerStats(customer._id.toString(), orders);
          
          await User.findByIdAndUpdate(customer._id, {
            $set: stats
          });
          
          updatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `อัปเดตสถิติลูกค้าเรียบร้อยแล้ว ${updatedCount} รายการ`
      });
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