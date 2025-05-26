'use client';

import { useState, useEffect, useCallback } from 'react';
import { IOrder } from '@/models/Order';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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
  const [filteredOrders, setFilteredOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'daily'>('all');
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }).toString();

      const response = await fetch(`/api/orders?${query}`);
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
      
      // จัดกลุ่มข้อมูลตามวัน
      const dailyData: { [key: string]: DailySummary } = {};

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

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const toggleDateExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
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
    return filteredOrders.reduce((total, order) => total + order.totalAmount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'shipped': return 'จัดส่งแล้ว';
      case 'delivered': return 'ส่งสำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">กำลังโหลดข้อมูลออเดอร์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการออเดอร์</h1>
          <p className="text-gray-600">ติดตามและจัดการออเดอร์ของลูกค้า</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ออเดอร์ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
                <p className="text-3xl font-bold text-green-600">฿{calculateTotalAmount().toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ออเดอร์เฉลี่ย</p>
                <p className="text-3xl font-bold text-purple-600">
                  ฿{filteredOrders.length > 0 ? Math.round(calculateTotalAmount() / filteredOrders.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">วันที่เลือก</p>
                <p className="text-lg font-bold text-orange-600">
                  {Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} วัน
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ดูทั้งหมด
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                สรุปรายวัน
              </button>
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาออเดอร์, ชื่อลูกค้า, อีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="delivered">ส่งสำเร็จ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'daily' ? (
          /* Daily Summary View */
          <div className="space-y-4">
            <AnimatePresence>
              {dailySummaries.length > 0 ? (
                dailySummaries.map((summary, index) => (
                  <motion.div
                    key={summary.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div
                      className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleDateExpand(summary.date)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{formatDate(summary.date)}</h3>
                          <p className="text-sm text-gray-600">{summary.totalOrders} ออเดอร์</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">฿{summary.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">ยอดขายรวม</p>
                        </div>
                        {expandedDate === summary.date ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedDate === summary.date && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-6 space-y-4">
                            {summary.orders.map((order) => (
                              <div key={order._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">#{order._id.slice(-8)}</p>
                                  <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                                  <p className="text-xs text-gray-500">{formatDateTime(order.orderDate)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">฿{order.totalAmount.toLocaleString()}</p>
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลในช่วงวันที่ที่เลือก</p>
                  <p className="text-gray-600">ลองปรับเปลี่ยนช่วงวันที่หรือเพิ่มออเดอร์ใหม่</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* All Orders View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">รายการออเดอร์ ({filteredOrders.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ออเดอร์</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ลูกค้า</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">วันที่</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ยอดรวม</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, idx) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: idx * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm font-medium text-gray-900">#{order._id.slice(-8)}</div>
                            <div className="text-xs text-gray-500">{order.items.length} รายการ</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{order.customerInfo.name}</div>
                            <div className="text-sm text-gray-600">{order.customerInfo.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{formatDateTime(order.orderDate)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-lg font-bold text-green-600">฿{order.totalAmount.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-lg font-medium">ไม่พบออเดอร์</p>
                            <p className="text-sm">ลองปรับเปลี่ยนคำค้นหาหรือช่วงวันที่</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
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