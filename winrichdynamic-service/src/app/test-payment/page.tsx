'use client';

import React, { useState, useEffect } from 'react';
import PaymentStatusTracker from '@/components/PaymentStatusTracker';
import type { IOrder } from '@/models/Order';

export default function TestPaymentPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/orders?limit=50', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'ไม่สามารถโหลดรายการออเดอร์ได้');
      }
      const list = Array.isArray(data) ? data : data.data || [];
      setOrders(list);
      setSelectedOrder(list[0] || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดออเดอร์';
      setError(message);
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderUpdate = (updatedOrder: any) => {
    setSelectedOrder(updatedOrder);
    setOrders(prev => prev.map(order => (order._id === updatedOrder._id ? updatedOrder : order)));
  };

  const testNotificationAPI = async (type: string) => {
    try {
      const response = await fetch('/api/payments/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();
      alert(`ผลการทดสอบ: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('Error testing notification API:', error);
      alert('เกิดข้อผิดพลาดในการทดสอบ API');
    }
  };

  const createTestOrder = async (paymentMethod: string) => {
    try {
      const orderData = {
        customerName: 'ลูกค้าทดสอบ',
        customerPhone: '0899999999',
        items: [
          {
            productId: '507f1f77bcf86cd799439017',
            name: 'สินค้าทดสอบ',
            price: 999,
            quantity: 1,
          }
        ],
        shippingFee: 50,
        discount: 0,
        paymentMethod,
        ...(paymentMethod === 'credit' && {
          creditPaymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      const created = result?.data || result?.order;
      if (created) {
        setOrders(prev => [created, ...prev]);
        setSelectedOrder(created);
      } else {
        await loadOrders();
      }
      alert(`สร้างออเดอร์สำเร็จ: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('Error creating test order:', error);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์ทดสอบ');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ทดสอบระบบการชำระเงิน</h1>
          <p className="text-gray-600">หน้านี้สำหรับทดสอบการทำงานของระบบติดตามสถานะการชำระเงิน</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">เลือกออเดอร์ทดสอบ</h2>
              <div className="space-y-2">
                {loading && <div className="text-sm text-gray-500">กำลังโหลดออเดอร์...</div>}
                {!loading && error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !error && orders.length === 0 && (
                  <div className="text-sm text-gray-500">ไม่พบออเดอร์ในระบบ</div>
                )}
                {!loading && !error && orders.map((order) => (
                  <button
                    key={(order._id as any).toString()}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      (selectedOrder as any)?._id === order._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      ออเดอร์ #{String(order._id).slice(-6)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.customerName} • {order.paymentMethod}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ฿{Number(order.totalAmount || 0).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่า</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">โหมดผู้ดูแลระบบ</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ทดสอบ API</h2>
              <div className="space-y-3">
                <button
                  onClick={() => testNotificationAPI('cod_reminders')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  ทดสอบการแจ้งเตือน COD
                </button>
                <button
                  onClick={() => testNotificationAPI('credit_due_notifications')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  ทดสอบการแจ้งเตือนเครดิต
                </button>
                <button
                  onClick={() => testNotificationAPI('all')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  ทดสอบทั้งหมด
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">สร้างออเดอร์ทดสอบ</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => createTestOrder('cod')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    สร้างออเดอร์ COD
                  </button>
                  <button
                    onClick={() => createTestOrder('transfer')}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    สร้างออเดอร์โอนเงิน
                  </button>
                  <button
                    onClick={() => createTestOrder('credit')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    สร้างออเดอร์เครดิต
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Tracker */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <PaymentStatusTracker
                order={selectedOrder}
                onUpdate={handleOrderUpdate}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-500">
                ไม่มีออเดอร์สำหรับแสดงผล
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
