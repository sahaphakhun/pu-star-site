'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [key: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'cod' | 'transfer';
  slipUrl?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  status: 'cancelled';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
}

const FailedOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        // กรองเฉพาะออเดอร์ที่ยกเลิก
        const cancelledOrders = data.filter((order: Order) => order.status === 'cancelled');
        setOrders(cancelledOrders);
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้:', error);
      toast.error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('อัพเดทสถานะเรียบร้อย');
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateObj = new Date(order.createdAt);
    let datePass = true;
    
    if (dateFilter === 'today') {
      const now = new Date();
      datePass = dateObj.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      datePass = dateObj >= weekAgo && dateObj <= now;
    } else if (dateFilter === 'month') {
      const now = new Date();
      datePass = dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      datePass = dateObj >= new Date(customStart) && dateObj <= new Date(customEnd);
    }
    
    return matchesSearch && datePass;
  });

  const totalLoss = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ออเดอร์ที่ยกเลิก</h1>
          <p className="text-gray-600">ออเดอร์ที่ไม่สามารถจัดส่งได้หรือถูกยกเลิก</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-red-600">{filteredOrders.length}</div>
            <div className="text-sm text-gray-600">ออเดอร์ที่ยกเลิก</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-orange-600">฿{totalLoss.toLocaleString()}</div>
            <div className="text-sm text-gray-600">ยอดขายที่สูญเสีย</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{filteredOrders.length > 0 ? Math.round(totalLoss / filteredOrders.length) : 0}</div>
            <div className="text-sm text-gray-600">ยอดขายเฉลี่ยต่อออเดอร์</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือรหัสออเดอร์"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">กรองตามวัน</label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value as any)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทุกเวลา</option>
                <option value="today">วันนี้</option>
                <option value="week">7 วันล่าสุด</option>
                <option value="month">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">จาก</label>
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ถึง</label>
                  <input 
                    type="date" 
                    value={customEnd} 
                    onChange={(e) => setCustomEnd(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสออเดอร์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สั่งซื้อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การชำระเงิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          ❌ ยกเลิก
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบออเดอร์ที่ยกเลิก</h3>
              <p className="text-gray-600">ไม่มีออเดอร์ที่ยกเลิกในช่วงเวลาที่เลือก</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  รายละเอียดออเดอร์ #{selectedOrder._id.slice(-8).toUpperCase()}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold text-red-800">ออเดอร์ถูกยกเลิก</span>
                  </div>
                  <div className="mt-2 text-sm text-red-700">
                    ออเดอร์นี้ไม่สามารถจัดส่งได้หรือถูกยกเลิกแล้ว
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>ชื่อ:</strong> {selectedOrder.customerName}</p>
                  <p><strong>เบอร์โทร:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>ที่อยู่:</strong> {selectedOrder.customerAddress}</p>
                  <p><strong>การชำระเงิน:</strong> {selectedOrder.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">จำนวน: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">฿{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>ยอดรวม:</span>
                    <span className="font-bold">฿{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Restore Actions */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">การดำเนินการ</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'pending')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                  >
                    เปลี่ยนเป็น รอดำเนินการ
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'confirmed')}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    เปลี่ยนเป็น ยืนยันออเดอร์
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  หากต้องการกู้คืนออเดอร์ สามารถเปลี่ยนสถานะได้
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FailedOrdersPage; 