'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  getCustomerTypeLabel, 
  getCustomerTypeColor 
} from '@/utils/customerAnalytics';

interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string;
  taxId?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  createdAt: Date;
}

const NewCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalNewCustomers: 0,
    todayNewCustomers: 0,
    weekNewCustomers: 0,
    monthNewCustomers: 0,
    conversionRate: 0,
    averageTimeToFirstOrder: 0
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        customerType: 'new', // กรองเฉพาะลูกค้าใหม่
        sortBy,
        sortOrder,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data.customers);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCustomers(data.data.pagination.totalCustomers);
        
        // คำนวณสถิติ
        const newCustomers = data.data.customers;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todayNewCustomers = newCustomers.filter((c: Customer) => 
          new Date(c.createdAt) >= today
        ).length;
        
        const weekNewCustomers = newCustomers.filter((c: Customer) => 
          new Date(c.createdAt) >= weekAgo
        ).length;
        
        const monthNewCustomers = newCustomers.filter((c: Customer) => 
          new Date(c.createdAt) >= monthAgo
        ).length;
        
        // อัตราการแปลงเป็นลูกค้าที่ซื้อจริง
        const customersWithOrders = newCustomers.filter((c: Customer) => (c.totalOrders || 0) > 0);
        const conversionRate = newCustomers.length > 0 ? (customersWithOrders.length / newCustomers.length) * 100 : 0;
        
        setStats({
          totalNewCustomers: newCustomers.length,
          todayNewCustomers,
          weekNewCustomers,
          monthNewCustomers,
          conversionRate,
          averageTimeToFirstOrder: 0 // จะคำนวณจากข้อมูลจริง
        });
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, dateRange, sortBy, sortOrder]);

  const handleSendWelcome = async () => {
    if (!selectedCustomer || !welcomeMessage.trim()) {
      toast.error('กรุณาระบุข้อความต้อนรับ');
      return;
    }

    try {
      // ในที่นี้จะเป็นการส่ง SMS หรือ notification
      // สำหรับตัวอย่างจะแสดงแค่ success message
      toast.success('ส่งข้อความต้อนรับเรียบร้อยแล้ว');
      setShowWelcomeModal(false);
      setWelcomeMessage('');
    } catch (error) {
      console.error('Error sending welcome message:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getTimeSinceRegistration = (createdAt: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - new Date(createdAt).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้าใหม่</h1>
          <p className="text-gray-600">ลูกค้าที่เพิ่งสมัครและต้องการการดูแลเป็นพิเศษ</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            🆕 {totalCustomers.toLocaleString()} ลูกค้าใหม่
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าใหม่ทั้งหมด</h3>
          <p className="text-2xl font-bold text-green-600">{stats.totalNewCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าใหม่วันนี้</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.todayNewCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าใหม่สัปดาห์นี้</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.weekNewCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">อัตราการแปลง</h3>
          <p className="text-2xl font-bold text-orange-600">{Math.round(stats.conversionRate)}%</p>
          <p className="text-xs text-gray-500">ที่ซื้อจริง</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 การดำเนินการด่วน</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">📧</div>
            <h4 className="font-medium text-gray-900">ส่งข้อความต้อนรับ</h4>
            <p className="text-sm text-gray-600 mb-3">ส่งข้อความต้อนรับลูกค้าใหม่</p>
            <button 
              onClick={() => {
                if (customers.length > 0) {
                  setSelectedCustomer(customers[0]);
                  setShowWelcomeModal(true);
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              เริ่มต้น
            </button>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">🎁</div>
            <h4 className="font-medium text-gray-900">ส่งโปรโมชั่น</h4>
            <p className="text-sm text-gray-600 mb-3">ส่งคูปองส่วนลดให้ลูกค้าใหม่</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              ส่งโปรโมชั่น
            </button>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">📞</div>
            <h4 className="font-medium text-gray-900">ติดตามลูกค้า</h4>
            <p className="text-sm text-gray-600 mb-3">โทรติดตามลูกค้าที่ยังไม่ได้สั่งซื้อ</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
              ดูรายชื่อ
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ชื่อ, เบอร์โทร, อีเมล"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เรียงลำดับ</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">สมัครล่าสุด</option>
              <option value="createdAt-asc">สมัครเก่าสุด</option>
              <option value="totalOrders-desc">มีออเดอร์มากสุด</option>
              <option value="totalOrders-asc">ยังไม่มีออเดอร์</option>
              <option value="name-asc">ชื่อ A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={resetFilters}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            🔄 รีเซ็ตตัวกรอง
          </button>
          <p className="text-sm text-gray-600">
            แสดง {customers.length} จาก {totalCustomers.toLocaleString()} รายการ
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ออเดอร์
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ยอดซื้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ระยะเวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-800 font-bold text-sm">🆕</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(customer.totalOrders || 0) > 0 ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ✅ ซื้อแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ⏳ ยังไม่ซื้อ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalOrders || 0} ครั้ง
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ฿{(customer.totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTimeSinceRegistration(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setWelcomeMessage(`สวัสดีคุณ ${customer.name} ยินดีต้อนรับสู่ Next Star Innovation! 🎉`);
                        setShowWelcomeModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      ส่งข้อความ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                หน้า {currentPage} จาก {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดลูกค้าใหม่</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทลูกค้า</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(selectedCustomer.customerType)}`}>
                    {getCustomerTypeLabel(selectedCustomer.customerType)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">จำนวนออเดอร์</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.totalOrders || 0} ครั้ง</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ยอดซื้อรวม</label>
                  <p className="mt-1 text-sm text-gray-900">฿{(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สมัครสมาชิก</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ระยะเวลาที่เป็นสมาชิก</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getTimeSinceRegistration(selectedCustomer.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">💡 คำแนะนำ</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  {(selectedCustomer.totalOrders || 0) === 0 && (
                    <li>• ส่งข้อความต้อนรับและโปรโมชั่นพิเศษ</li>
                  )}
                  {(selectedCustomer.totalOrders || 0) > 0 && (
                    <li>• ลูกค้าได้ทำการซื้อแล้ว ควรติดตามเพื่อสร้างความสัมพันธ์</li>
                  )}
                  <li>• โทรติดตามเพื่อสอบถามความพึงพอใจ</li>
                  <li>• เสนอผลิตภัณฑ์ที่เหมาะสม</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Welcome Message Modal */}
      {showWelcomeModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">ส่งข้อความต้อนรับ</h2>
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">ลูกค้า: <span className="font-medium">{selectedCustomer.name}</span></p>
                <p className="text-sm text-gray-600">เบอร์โทร: <span className="font-medium">{selectedCustomer.phoneNumber}</span></p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความ</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                  placeholder="ระบุข้อความต้อนรับ..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendWelcome}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ส่งข้อความ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NewCustomersPage; 