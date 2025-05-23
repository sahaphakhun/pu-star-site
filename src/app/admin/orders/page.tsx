'use client';

import { useState, useEffect, useCallback } from 'react';
import { IOrder } from '@/models/Order';

interface OrderWithId extends IOrder {
  _id: string;
}

interface DailySummary {
  date: string;
  totalOrders: number;
  totalAmount: number;
  orders: OrderWithId[];
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'daily'>('all');
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchOrders = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }).toString();

      const response = await fetch(`/api/orders?${query}`);
      const data = await response.json();
      setOrders(data);
      
      // ย้ายการจัดกลุ่มข้อมูลมาไว้ในนี้
      const dailyData: { [key: string]: DailySummary } = {};

      // จัดกลุ่มออเดอร์ตามวัน
      data.forEach((order: OrderWithId) => {
        const date = new Date(order.orderDate).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            totalOrders: 0,
            totalAmount: 0,
            orders: []
          };
        }
        
        dailyData[date].totalOrders += 1;
        dailyData[date].totalAmount += order.totalAmount;
        dailyData[date].orders.push(order);
      });

      // แปลงเป็น array และเรียงตามวันที่ล่าสุด
      const summaries = Object.values(dailyData).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setDailySummaries(summaries);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลออเดอร์ได้:', error);
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleDateExpand = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  const formatDateTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateTotalAmount = () => {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">รายการออเดอร์ทั้งหมด</h1>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="flex space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              ดูทั้งหมด
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'daily'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              สรุปรายวัน
            </button>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div>
              <label className="block text-sm mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <p className="text-sm text-gray-600">จำนวนออเดอร์</p>
              <p className="text-xl font-bold">{orders.length} รายการ</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ยอดขายรวม</p>
              <p className="text-xl font-bold">฿{calculateTotalAmount().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ช่วงวันที่</p>
              <p className="text-base font-medium">{formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}</p>
            </div>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <div className="space-y-4">
            {dailySummaries.length > 0 ? (
              dailySummaries.map((summary) => (
                <div key={summary.date} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleDateExpand(summary.date)}
                  >
                    <div>
                      <h3 className="font-semibold">{formatDate(summary.date)}</h3>
                      <p className="text-sm text-gray-600">{summary.totalOrders} ออเดอร์</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">฿{summary.totalAmount.toLocaleString()}</p>
                      <span className="text-sm text-blue-500">
                        {expandedDate === summary.date ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                      </span>
                    </div>
                  </div>

                  {expandedDate === summary.date && (
                    <div className="p-4 bg-white">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชำระเงิน</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สลิป</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {summary.orders.map((order) => (
                              <tr key={order._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(order.orderDate)}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <p className="font-medium">{order.customerName}</p>
                                  <p className="text-sm text-gray-500">{order.customerPhone}</p>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{order.customerAddress || '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {order.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}
                                </td>
                                <td className="px-4 py-2">
                                  <ul className="list-disc list-inside text-sm">
                                    {order.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.name} x{item.quantity} (฿{item.price.toLocaleString()})
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                                <td className="px-4 py-2 text-right whitespace-nowrap font-medium">฿{order.totalAmount.toLocaleString()}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {order.paymentMethod === 'transfer' && order.slipUrl ? (
                                    <a href={order.slipUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดูสลิป</a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่/เวลา</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชำระเงิน</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สลิป</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{formatDateTime(order.orderDate)}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <p className="font-medium text-xs sm:text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{order.customerAddress || '-'}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                          {order.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <ul className="list-disc list-inside text-xs sm:text-sm">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.name} x{item.quantity} (฿{item.price.toLocaleString()})
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap font-medium text-xs sm:text-sm">฿{order.totalAmount.toLocaleString()}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {order.paymentMethod === 'transfer' && order.slipUrl ? (
                            <a href={order.slipUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดูสลิป</a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        ไม่พบรายการสั่งซื้อในช่วงเวลาที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage; 