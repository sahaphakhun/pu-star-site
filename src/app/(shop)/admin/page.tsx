'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  claimedOrders: number;
  recentOrders: Array<{
    _id: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

const AdminDashboard = () => {
  const { hasPermission, isAdmin } = usePermissions();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    claimedOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // ดึงข้อมูลออเดอร์
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      
      // ดึงข้อมูลลูกค้า
      const customersRes = await fetch('/api/admin/customers?limit=1');
      const customersData = await customersRes.json();

      if (ordersData.orders && Array.isArray(ordersData.orders)) {
        const orders = ordersData.orders;
        
        // คำนวณสถิติ
        const totalOrders = orders.length;
        const totalRevenue = orders
          .filter((order: any) => ['delivered', 'confirmed', 'shipped'].includes(order.status))
          .reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
        const claimedOrders = orders.filter((order: any) => 
          ['claimed', 'claim_approved', 'claim_rejected'].includes(order.status)
        ).length;
        
        // ออเดอร์ล่าสุด 5 รายการ
        const recentOrders = orders
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalOrders,
          totalCustomers: customersData.totalCustomers || 0,
          totalRevenue,
          pendingOrders,
          claimedOrders,
          recentOrders
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      ready: 'พร้อมส่ง',
      shipped: 'จัดส่งแล้ว',
      delivered: 'ส่งสำเร็จ',
      cancelled: 'ยกเลิก',
      claimed: 'มีการเคลม',
      claim_approved: 'เคลมสำเร็จ',
      claim_rejected: 'เคลมถูกปฏิเสธ'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready: 'bg-orange-100 text-orange-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      claimed: 'bg-pink-100 text-pink-800',
      claim_approved: 'bg-teal-100 text-teal-800',
      claim_rejected: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อะไรบ้าง
  const hasAnyPermission = isAdmin || 
    hasPermission(PERMISSIONS.ORDERS_VIEW) || 
    hasPermission(PERMISSIONS.CUSTOMERS_VIEW) || 
    hasPermission(PERMISSIONS.PRODUCTS_VIEW) || 
    hasPermission(PERMISSIONS.ORDERS_CLAIMS_VIEW);

  if (!hasAnyPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">ยินดีต้อนรับสู่ระบบแอดมิน</h2>
          <p className="text-gray-600 mb-2">คุณยังไม่ได้รับสิทธิ์ในการเข้าถึงข้อมูลใดๆ</p>
          <p className="text-gray-500 text-sm">กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การใช้งาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดแอดมิน</h1>
        <p className="text-gray-600">ภาพรวมของระบบการจัดการคำสั่งซื้อ</p>
      </div>

      {/* Stats Cards */}
      {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW) || hasPermission(PERMISSIONS.ORDERS_CLAIMS_VIEW) || hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">ออเดอร์ทั้งหมด</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">ยอดขายรวม</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">ลูกค้าทั้งหมด</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">รอดำเนินการ</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || hasPermission(PERMISSIONS.ORDERS_CLAIMS_VIEW)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">มีการเคลม</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.claimedOrders}</p>
              </div>
            </div>
          </div>
                  )}
          </div>
        )}

      {/* Quick Actions */}
      {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW) || hasPermission(PERMISSIONS.ORDERS_CLAIMS_VIEW) || hasPermission(PERMISSIONS.CUSTOMERS_VIEW) || hasPermission(PERMISSIONS.PRODUCTS_VIEW)) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
            <Link href="/admin/orders" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-800">จัดการออเดอร์</span>
            </Link>
          )}

          {(isAdmin || hasPermission(PERMISSIONS.ORDERS_CLAIMS_VIEW)) && (
            <Link href="/admin/orders/claims" className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-red-800">จัดการเคลม</span>
            </Link>
          )}

          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) && (
            <Link href="/admin/customers" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-purple-800">จัดการลูกค้า</span>
            </Link>
          )}

          {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_VIEW)) && (
            <Link href="/admin/products" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-800">จัดการสินค้า</span>
            </Link>
          )}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ออเดอร์ล่าสุด</h2>
            <Link href="/admin/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              ดูทั้งหมด
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </Link>
          </div>
        
        {stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">หมายเลขออเดอร์</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ลูกค้า</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ยอดรวม</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">สถานะ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">#{order._id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.customerName}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>ยังไม่มีออเดอร์</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 