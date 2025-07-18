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

const InactiveCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWinBackModal, setShowWinBackModal] = useState(false);
  const [winBackMessage, setWinBackMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [sortBy, setSortBy] = useState('lastOrderDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minDaysInactive, setMinDaysInactive] = useState('90');
  const [maxDaysInactive, setMaxDaysInactive] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalInactiveCustomers: 0,
    recentlyInactive: 0, // 90-180 วัน
    longTermInactive: 0, // >180 วัน
    potentialRevenue: 0,
    averageDaysInactive: 0,
    riskCustomers: [] as Customer[]
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        customerType: 'inactive', // กรองเฉพาะลูกค้าห่างหาย
        assignedTo: assignedToFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data.customers);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCustomers(data.data.pagination.totalCustomers);
        
        // คำนวณสถิติ
        const inactiveCustomers = data.data.customers;
        const now = new Date();
        
        let totalDaysInactive = 0;
        let recentlyInactive = 0;
        let longTermInactive = 0;
        let potentialRevenue = 0;
        
        inactiveCustomers.forEach((customer: Customer) => {
          const daysSinceOrder = getDaysSinceLastOrder(customer.lastOrderDate);
          totalDaysInactive += daysSinceOrder;
          
          if (daysSinceOrder >= 90 && daysSinceOrder <= 180) {
            recentlyInactive++;
          } else if (daysSinceOrder > 180) {
            longTermInactive++;
          }
          
          // คำนวณรายได้ที่อาจสูญเสีย (ค่าเฉลี่ยต่อออเดอร์)
          potentialRevenue += customer.averageOrderValue || 0;
        });
        
        const averageDaysInactive = inactiveCustomers.length > 0 ? 
          Math.round(totalDaysInactive / inactiveCustomers.length) : 0;
        
        // ลูกค้าที่มีความเสี่ยงสูง (เคยซื้อมากแต่ห่างหาย)
        const riskCustomers = inactiveCustomers
          .filter((c: Customer) => (c.totalSpent || 0) > 5000)
          .sort((a: Customer, b: Customer) => (b.totalSpent || 0) - (a.totalSpent || 0))
          .slice(0, 5);
        
        setStats({
          totalInactiveCustomers: inactiveCustomers.length,
          recentlyInactive,
          longTermInactive,
          potentialRevenue,
          averageDaysInactive,
          riskCustomers
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
  }, [currentPage, searchTerm, assignedToFilter, sortBy, sortOrder, minDaysInactive, maxDaysInactive]);

  const handleSendWinBackMessage = async () => {
    if (!selectedCustomer || !winBackMessage.trim()) {
      toast.error('กรุณาระบุข้อความดึงกลับ');
      return;
    }

    try {
      // ในที่นี้จะเป็นการส่งข้อความดึงกลับลูกค้า
      toast.success('ส่งข้อความดึงกลับลูกค้าเรียบร้อยแล้ว');
      setShowWinBackModal(false);
      setWinBackMessage('');
    } catch (error) {
      console.error('Error sending win-back message:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ');
    }
  };

  const handleBulkWinBack = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('กรุณาเลือกลูกค้าที่ต้องการส่งข้อความ');
      return;
    }

    try {
      // ส่งข้อความหลายคนพร้อมกัน
      toast.success(`ส่งข้อความดึงกลับลูกค้าเรียบร้อยแล้ว ${selectedCustomers.length} รายการ`);
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Error sending bulk win-back:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAssignedToFilter('');
    setSortBy('lastOrderDate');
    setSortOrder('asc');
    setMinDaysInactive('90');
    setMaxDaysInactive('');
    setCurrentPage(1);
  };

  const getDaysSinceLastOrder = (lastOrderDate?: Date) => {
    if (!lastOrderDate) return 999;
    const now = new Date();
    const diffTime = now.getTime() - new Date(lastOrderDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getInactiveLevel = (daysSinceOrder: number) => {
    if (daysSinceOrder <= 90) return { label: 'เพิ่งห่างหาย', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
    if (daysSinceOrder <= 180) return { label: 'ห่างหายปานกลาง', color: 'bg-orange-100 text-orange-800', icon: '🔔' };
    if (daysSinceOrder <= 365) return { label: 'ห่างหายนาน', color: 'bg-red-100 text-red-800', icon: '🚨' };
    return { label: 'ห่างหายมากกว่า 1 ปี', color: 'bg-gray-100 text-gray-800', icon: '💀' };
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
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
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้าห่างหาย</h1>
          <p className="text-gray-600">ลูกค้าที่ไม่ได้สั่งซื้อนานและต้องการการติดตาม</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            😴 {totalCustomers.toLocaleString()} ลูกค้าห่างหาย
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าห่างหายทั้งหมด</h3>
          <p className="text-2xl font-bold text-red-600">{stats.totalInactiveCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">เพิ่งห่างหาย</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.recentlyInactive.toLocaleString()}</p>
          <p className="text-xs text-gray-500">90-180 วัน</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ห่างหายนาน</h3>
          <p className="text-2xl font-bold text-gray-600">{stats.longTermInactive.toLocaleString()}</p>
          <p className="text-xs text-gray-500">&gt;180 วัน</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">เฉลี่ยวันห่างหาย</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.averageDaysInactive}</p>
          <p className="text-xs text-gray-500">วัน</p>
        </div>
      </div>

      {/* Potential Revenue */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 รายได้ที่อาจสูญเสีย</h3>
        <p className="text-2xl font-bold text-red-600">฿{stats.potentialRevenue.toLocaleString()}</p>
        <p className="text-sm text-gray-600">ค่าเฉลี่ยต่อออเดอร์รวมของลูกค้าที่ห่างหาย</p>
      </div>

      {/* Risk Customers */}
      {stats.riskCustomers.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 ลูกค้าเสี่ยงสูง</h3>
          <p className="text-sm text-gray-600 mb-4">ลูกค้าที่เคยซื้อมากแต่ห่างหายไป</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.riskCustomers.map((customer, index) => (
              <div key={customer._id} className="text-center p-3 bg-red-50 rounded-lg">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-red-800 font-bold text-sm">🚨</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
                <p className="text-sm font-bold text-red-600">฿{(customer.totalSpent || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{customer.totalOrders || 0} ออเดอร์</p>
                <p className="text-xs text-red-600">
                  {getDaysSinceLastOrder(customer.lastOrderDate)} วันที่แล้ว
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Win-Back Actions */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 การดึงกลับลูกค้า</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📧</div>
            <h4 className="font-medium text-gray-900">ส่งข้อความดึงกลับ</h4>
            <p className="text-sm text-gray-600 mb-3">ส่งข้อความพิเศษให้ลูกค้าห่างหาย</p>
            <button 
              onClick={() => {
                if (customers.length > 0) {
                  setSelectedCustomer(customers[0]);
                  setWinBackMessage('เรายินดีต้อนรับคุณกลับมา! รับส่วนลดพิเศษ 20% สำหรับการสั่งซื้อครั้งถัดไป 🎁');
                  setShowWinBackModal(true);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              ส่งข้อความ
            </button>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎁</div>
            <h4 className="font-medium text-gray-900">ส่งโปรโมชั่นพิเศษ</h4>
            <p className="text-sm text-gray-600 mb-3">ส่งคูปองส่วนลดพิเศษ</p>
            <button 
              onClick={handleBulkWinBack}
              disabled={selectedCustomers.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ส่งให้ที่เลือก ({selectedCustomers.length})
            </button>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">📞</div>
            <h4 className="font-medium text-gray-900">โทรติดตาม</h4>
            <p className="text-sm text-gray-600 mb-3">โทรติดตามลูกค้าเสี่ยงสูง</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับผิดชอบ</label>
            <input
              type="text"
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              placeholder="ชื่อผู้รับผิดชอบ"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันห่างหายขั้นต่ำ</label>
            <input
              type="number"
              value={minDaysInactive}
              onChange={(e) => setMinDaysInactive(e.target.value)}
              placeholder="90"
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
              <option value="lastOrderDate-asc">ห่างหายนานสุด</option>
              <option value="lastOrderDate-desc">ห่างหายล่าสุด</option>
              <option value="totalSpent-desc">เคยซื้อมากสุด</option>
              <option value="totalOrders-desc">เคยซื้อบ่อยสุด</option>
              <option value="createdAt-desc">สมัครล่าสุด</option>
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
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={toggleAllCustomers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ระดับความเสี่ยง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ออเดอร์เดิม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ยอดซื้อเดิม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้รับผิดชอบ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ห่างหาย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => {
                const daysSinceOrder = getDaysSinceLastOrder(customer.lastOrderDate);
                const inactiveLevel = getInactiveLevel(daysSinceOrder);
                const isSelected = selectedCustomers.includes(customer._id);
                
                return (
                  <tr key={customer._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCustomerSelection(customer._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-800 font-bold text-sm">😴</span>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inactiveLevel.color}`}>
                        {inactiveLevel.icon} {inactiveLevel.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalOrders || 0} ครั้ง
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{(customer.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.assignedTo ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {customer.assignedTo}
                          </span>
                        ) : (
                          <span className="text-gray-400">ไม่ได้กำหนด</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.lastOrderDate ? 
                          new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : 'ไม่เคยซื้อ'}
                      </div>
                      <div className="text-xs text-red-600">
                        {daysSinceOrder} วันที่แล้ว
                      </div>
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
                          setWinBackMessage(`สวัสดีคุณ ${customer.name} เรายินดีต้อนรับคุณกลับมา! รับส่วนลดพิเศษ 20% 🎁`);
                          setShowWinBackModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        ดึงกลับ
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดลูกค้าห่างหาย</h2>
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
                  <label className="block text-sm font-medium text-gray-700">ผู้รับผิดชอบ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.assignedTo || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">เลขผู้เสียภาษี</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.taxId || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">จำนวนออเดอร์เดิม</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.totalOrders || 0} ครั้ง</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ยอดซื้อรวมเดิม</label>
                  <p className="mt-1 text-sm text-gray-900">฿{(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ค่าเฉลี่ยต่อออเดอร์</label>
                  <p className="mt-1 text-sm text-gray-900">฿{Math.round(selectedCustomer.averageOrderValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สั่งซื้อล่าสุด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.lastOrderDate ? 
                      new Date(selectedCustomer.lastOrderDate).toLocaleDateString('th-TH') : 'ไม่เคยซื้อ'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สมัครสมาชิก</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">จำนวนวันที่ห่างหาย</label>
                  <p className="mt-1 text-sm text-red-600 font-bold">
                    {getDaysSinceLastOrder(selectedCustomer.lastOrderDate)} วัน
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 mb-2">😴 สถานะห่างหาย</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• ลูกค้าไม่ได้สั่งซื้อมากกว่า 90 วัน</li>
                  <li>• ควรติดตามและส่งโปรโมชั่นพิเศษ</li>
                  <li>• มีโอกาสสูญเสียลูกค้าถาวร</li>
                  {(selectedCustomer.totalSpent || 0) > 5000 && (
                    <li>• ลูกค้าเสี่ยงสูง (เคยซื้อมากกว่า 5,000 บาท)</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Win-Back Message Modal */}
      {showWinBackModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">ส่งข้อความดึงกลับ</h2>
                <button
                  onClick={() => setShowWinBackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">ลูกค้า: <span className="font-medium">{selectedCustomer.name}</span></p>
                <p className="text-sm text-gray-600">เบอร์โทร: <span className="font-medium">{selectedCustomer.phoneNumber}</span></p>
                <p className="text-sm text-red-600">ห่างหาย: <span className="font-medium">{getDaysSinceLastOrder(selectedCustomer.lastOrderDate)} วัน</span></p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความดึงกลับ</label>
                <textarea
                  value={winBackMessage}
                  onChange={(e) => setWinBackMessage(e.target.value)}
                  rows={4}
                  placeholder="ระบุข้อความดึงกลับลูกค้า..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWinBackModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendWinBackMessage}
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

export default InactiveCustomersPage; 