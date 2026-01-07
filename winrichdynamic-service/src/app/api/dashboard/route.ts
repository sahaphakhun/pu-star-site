import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Deal from '@/models/Deal';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Activity from '@/models/Activity';
import Quotation from '@/models/Quotation';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';

// GET: ดึงข้อมูลสำหรับ Dashboard (KPIs, charts, statistics)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get user info from token for RBAC
    let userFilter = {};
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        
        if (roleName === 'seller') {
          // จำกัดข้อมูลสำหรับ Seller ให้เห็นเฉพาะของตนเอง
          userFilter = { ownerId: payload.adminId };
        }
      }
    } catch (error) {
      console.error('[Dashboard API] Token decode error:', error);
    }

    // Get date ranges for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Projects statistics
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      projectsThisMonth,
      projectsValue
    ] = await Promise.all([
      Project.countDocuments(userFilter),
      Project.countDocuments({ ...userFilter, status: { $in: ['planning', 'proposed', 'quoted', 'testing', 'approved'] } }),
      Project.countDocuments({ ...userFilter, status: 'closed' }),
      Project.countDocuments({ ...userFilter, createdAt: { $gte: startOfMonth } }),
      Project.aggregate([
        { $match: { ...userFilter, status: { $ne: 'closed' } } },
        { $group: { _id: null, totalValue: { $sum: '$value' } } }
      ])
    ]);

    // Deals/Opportunities statistics
    const [
      totalDeals,
      openDeals,
      wonDeals,
      lostDeals,
      dealsThisMonth,
      totalPipelineValue,
      wonDealsValue
    ] = await Promise.all([
      Deal.countDocuments(userFilter),
      Deal.countDocuments({ ...userFilter, status: 'open' }),
      Deal.countDocuments({ ...userFilter, status: 'won' }),
      Deal.countDocuments({ ...userFilter, status: 'lost' }),
      Deal.countDocuments({ ...userFilter, createdAt: { $gte: startOfMonth } }),
      Deal.aggregate([
        { $match: { ...userFilter, status: 'open' } },
        { $group: { _id: null, totalValue: { $sum: '$amount' } } }
      ]),
      Deal.aggregate([
        { $match: { ...userFilter, status: 'won', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, totalValue: { $sum: '$amount' } } }
      ])
    ]);

    // Sales Orders statistics
    const [
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      ordersValue
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ orderDate: { $gte: startOfMonth } }),
      Order.countDocuments({ orderDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.aggregate([
        { $match: { orderDate: { $gte: startOfMonth } } },
        { $group: { _id: null, totalValue: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Customer statistics
    const [
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      customerTypes
    ] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true, createdAt: { $gte: startOfMonth } }),
      Customer.countDocuments({ isActive: true, customerType: { $in: ['regular', 'target'] } }),
      Customer.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$customerType', count: { $sum: 1 } } }
      ])
    ]);

    // Quotations statistics
    const [
      totalQuotations,
      sentQuotations,
      acceptedQuotations,
      quotationsThisMonth,
      quotationsValue
    ] = await Promise.all([
      Quotation.countDocuments(userFilter),
      Quotation.countDocuments({ ...userFilter, status: 'sent' }),
      Quotation.countDocuments({ ...userFilter, status: 'accepted' }),
      Quotation.countDocuments({ ...userFilter, createdAt: { $gte: startOfMonth } }),
      Quotation.aggregate([
        { $match: { ...userFilter, status: { $in: ['sent', 'accepted'] } } },
        { $group: { _id: null, totalValue: { $sum: '$grandTotal' } } }
      ])
    ]);

    // Recent activities
    const recentActivities = await Activity.find(userFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Project status distribution
    const projectStatusDistribution = await Project.aggregate([
      { $match: userFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Deal stage distribution (if we have PipelineStage data)
    const dealStageDistribution = await Deal.aggregate([
      { $match: { ...userFilter, status: 'open' } },
      { $group: { _id: '$stageName', count: { $sum: 1 }, totalValue: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly sales trend (last 6 months)
    const monthlySalesTrend = await Deal.aggregate([
      { 
        $match: { 
          ...userFilter, 
          status: 'won',
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalValue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly sales trend
    const formattedMonthlyTrend = monthlySalesTrend.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      value: item.totalValue,
      count: item.count
    }));

    const paymentMethodLabels: Record<string, string> = {
      cod: 'เงินสด',
      transfer: 'โอนเงิน',
      credit: 'เครดิต',
    };
    const paymentMethods = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const paymentMethodDistribution = paymentMethods.map((item) => ({
      name: paymentMethodLabels[item._id as string] || 'ไม่ระบุ',
      value: item.count || 0,
    }));

    const productGroupDistribution = await Order.aggregate([
      { $unwind: '$items' },
      {
        $addFields: {
          productObjectId: {
            $cond: [
              { $eq: [{ $type: '$items.productId' }, 'objectId'] },
              '$items.productId',
              { $convert: { input: '$items.productId', to: 'objectId', onError: null, onNull: null } },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productObjectId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $addFields: {
          productCategory: {
            $ifNull: [{ $arrayElemAt: ['$productInfo.category', 0] }, 'ไม่ระบุ'],
          },
          itemTotal: {
            $ifNull: [
              '$items.amount',
              { $multiply: ['$items.price', '$items.quantity'] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$productCategory',
          totalValue: { $sum: '$itemTotal' },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$totalValue',
        },
      },
    ]);

    const ownerFilterId = (userFilter as any)?.ownerId;
    const activityMatch = ownerFilterId ? { ownerId: ownerFilterId } : {};
    const projectMatch = ownerFilterId
      ? { ownerId: ownerFilterId, createdAt: { $gte: startOfMonth } }
      : { createdAt: { $gte: startOfMonth } };
    const quotationMatch = ownerFilterId ? { assignedTo: ownerFilterId } : {};
    const dealMatch = ownerFilterId ? { ownerId: ownerFilterId } : {};

    const [
      activityCounts,
      projectCounts,
      quotationCounts,
      negotiationCounts,
      lostCounts,
      winCounts,
    ] = await Promise.all([
      Activity.aggregate([
        { $match: activityMatch },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectMatch },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Quotation.aggregate([
        { $match: quotationMatch },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { ...dealMatch, stageName: { $regex: /(negotiat|ต่อรอง)/i } } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { ...dealMatch, status: 'lost' } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { ...dealMatch, status: 'won' } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
    ]);

    const buildCountMap = (rows: any[]) => {
      const map = new Map<string, number>();
      rows.forEach((row) => {
        if (!row?._id) return;
        map.set(String(row._id), Number(row.count || 0));
      });
      return map;
    };

    const activityMap = buildCountMap(activityCounts);
    const projectMap = buildCountMap(projectCounts);
    const quotationMap = buildCountMap(quotationCounts);
    const negotiationMap = buildCountMap(negotiationCounts);
    const lostMap = buildCountMap(lostCounts);
    const winMap = buildCountMap(winCounts);

    const ownerIds = Array.from(
      new Set([
        ...activityMap.keys(),
        ...projectMap.keys(),
        ...quotationMap.keys(),
        ...negotiationMap.keys(),
        ...lostMap.keys(),
        ...winMap.keys(),
      ])
    );

    const adminMap = new Map<string, string>();
    const validOwnerIds = ownerIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validOwnerIds.length > 0) {
      const admins = await Admin.find({ _id: { $in: validOwnerIds } })
        .select('name')
        .lean();
      admins.forEach((admin: any) => {
        const id = String(admin._id);
        adminMap.set(id, admin.name || 'ไม่ระบุชื่อ');
      });
    }

    const salesTeam = ownerIds.map((ownerId) => ({
      id: ownerId,
      name: adminMap.get(ownerId) || ownerId,
      total: activityMap.get(ownerId) || 0,
      new: projectMap.get(ownerId) || 0,
      quotation: quotationMap.get(ownerId) || 0,
      negotiation: negotiationMap.get(ownerId) || 0,
      lost: lostMap.get(ownerId) || 0,
      win: winMap.get(ownerId) || 0,
    })).sort((a, b) => b.total - a.total);

    // Calculate growth rates
    const ordersGrowthRate = ordersLastMonth > 0 
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100).toFixed(1)
      : '0';

    // Prepare response data
    const dashboardData = {
      kpis: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          thisMonth: projectsThisMonth,
          totalValue: projectsValue[0]?.totalValue || 0
        },
        deals: {
          total: totalDeals,
          open: openDeals,
          won: wonDeals,
          lost: lostDeals,
          thisMonth: dealsThisMonth,
          pipelineValue: totalPipelineValue[0]?.totalValue || 0,
          wonValue: wonDealsValue[0]?.totalValue || 0
        },
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          growthRate: parseFloat(ordersGrowthRate),
          totalValue: ordersValue[0]?.totalValue || 0
        },
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth,
          active: activeCustomers
        },
        quotations: {
          total: totalQuotations,
          sent: sentQuotations,
          accepted: acceptedQuotations,
          thisMonth: quotationsThisMonth,
          totalValue: quotationsValue[0]?.totalValue || 0
        }
      },
      charts: {
        projectStatusDistribution,
        dealStageDistribution,
        monthlySalesTrend: formattedMonthlyTrend,
        customerTypes: customerTypes.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        paymentMethods: paymentMethodDistribution,
        productGroups: productGroupDistribution,
        salesTeam,
      },
      recentActivities,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error('[Dashboard API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด' },
      { status: 500 }
    );
  }
}
