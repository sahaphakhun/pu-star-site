'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  customerType?: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface UserOrderData {
  user: User;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalSpent: number;
    averageOrderValue: number;
    orderCount: number;
  };
}

interface UserOrderHistoryProps {
  userId: string;
}

const UserOrderHistory: React.FC<UserOrderHistoryProps> = ({ userId }) => {
  const [data, setData] = useState<UserOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-orange-100 text-orange-800 border-orange-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    claimed: 'bg-pink-100 text-pink-800 border-pink-200',
    failed: 'bg-gray-100 text-gray-800 border-gray-200',
    claim_approved: 'bg-teal-100 text-teal-800 border-teal-200',
    claim_rejected: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    ready: 'พร้อมส่ง',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
    failed: 'ส่งไม่สำเร็จ',
    claim_approved: 'เคลมสำเร็จ',
    claim_rejected: 'เคลมถูกปฏิเสธ',
  };

  const loadUserOrders = async (page: number = 1, status: string = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(status !== 'all' && { status })
      });

      const response = await fetch(`/api/users/${userId}/orders?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error loading user orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserOrders(currentPage, statusFilter);
  }, [userId, currentPage, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        ไม่พบข้อมูล
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ข้อมูลผู้ใช้ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">ข้อมูลผู้ใช้</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">ชื่อ</div>
            <div className="font-medium">{data.user.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">เบอร์โทร</div>
            <div className="font-medium">{data.user.phoneNumber}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">อีเมล</div>
            <div className="font-medium">{data.user.email || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">ประเภทลูกค้า</div>
            <div className="font-medium">{data.user.customerType || '-'}</div>
          </div>
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">ยอดซื้อรวม</div>
          <div className="text-2xl font-bold text-green-600">
            ฿{data.stats.totalSpent.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">ค่าเฉลี่ยต่อออเดอร์</div>
          <div className="text-2xl font-bold text-blue-600">
            ฿{data.stats.averageOrderValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">จำนวนออเดอร์</div>
          <div className="text-2xl font-bold text-purple-600">
            {data.pagination.totalOrders}
          </div>
        </div>
      </div>

      {/* ตัวกรอง */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              กรองตามสถานะ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันออเดอร์แล้ว</option>
              <option value="ready">พร้อมส่ง</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="delivered">ส่งสำเร็จ</option>
              <option value="cancelled">ยกเลิก</option>
              <option value="claimed">เคลมสินค้า</option>
              <option value="failed">ส่งไม่สำเร็จ</option>
              <option value="claim_approved">เคลมสำเร็จ</option>
              <option value="claim_rejected">เคลมถูกปฏิเสธ</option>
            </select>
          </div>
        </div>
      </div>

      {/* รายการออเดอร์ */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">ประวัติออเดอร์</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">รหัสออเดอร์</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">รายการสินค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.orders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order._id.slice(-8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-xs text-gray-500">
                          และอีก {order.items.length - 2} รายการ
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ฿{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('th-TH')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                แสดง {((data.pagination.page - 1) * data.pagination.limit) + 1} ถึง {Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalOrders)} จาก {data.pagination.totalOrders} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={!data.pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  {data.pagination.page} / {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={!data.pagination.hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrderHistory;
