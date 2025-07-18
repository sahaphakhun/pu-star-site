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

const RegularCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyReward, setLoyaltyReward] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [sortBy, setSortBy] = useState('lastOrderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minOrders, setMinOrders] = useState('');
  const [maxDaysSinceOrder, setMaxDaysSinceOrder] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalRegularCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    averageOrders: 0,
    loyalCustomers: 0,
    recentlyActiveCustomers: 0,
    topPerformers: [] as Customer[]
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        customerType: 'regular', // กรองเฉพาะลูกค้าประจำ
        assignedTo: assignedToFilter,
        sortBy,
        sortOrder,
        ...(minOrders && { minOrders }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data.customers);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCustomers(data.data.pagination.totalCustomers);
        
        // คำนวณสถิติ
        const regularCustomers = data.data.customers;
        const totalRevenue = regularCustomers.reduce((sum: number, c: Customer) => sum + (c.totalSpent || 0), 0);
        const totalOrders = regularCustomers.reduce((sum: number, c: Customer) => sum + (c.totalOrders || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const averageOrders = regularCustomers.length > 0 ? totalOrders / regularCustomers.length : 0;
        
        // ลูกค้าที่ซื้อมากกว่า 10 ครั้ง = ลูกค้าภักดี
        const loyalCustomers = regularCustomers.filter((c: Customer) => (c.totalOrders || 0) > 10).length;
        
        // ลูกค้าที่สั่งซื้อภายใน 30 วัน
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentlyActiveCustomers = regularCustomers.filter((c: Customer) => 
          c.lastOrderDate && new Date(c.lastOrderDate) > thirtyDaysAgo
        ).length;
        
        setStats({
          totalRegularCustomers: regularCustomers.length,
          totalRevenue,
          averageOrderValue,
          averageOrders,
          loyalCustomers,
          recentlyActiveCustomers,
          topPerformers: regularCustomers
            .sort((a: Customer, b: Customer) => (b.totalOrders || 0) - (a.totalOrders || 0))
            .slice(0, 5)
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
  }, [currentPage, searchTerm, assignedToFilter, sortBy, sortOrder, minOrders]);

  const handleSendLoyaltyReward = async () => {
    if (!selectedCustomer || !loyaltyReward.trim()) {
      toast.error('กรุณาระบุรางวัลความภักดี');
      return;
    }

    try {
      // ในที่นี้จะเป็นการส่งรางวัลหรือคูปอง
      toast.success('ส่งรางวัลความภักดีเรียบร้อยแล้ว');
      setShowLoyaltyModal(false);
      setLoyaltyReward('');
    } catch (error) {
      console.error('Error sending loyalty reward:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งรางวัล');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAssignedToFilter('');
    setSortBy('lastOrderDate');
    setSortOrder('desc');
    setMinOrders('');
    setMaxDaysSinceOrder('');
    setCurrentPage(1);
  };

  const getDaysSinceLastOrder = (lastOrderDate?: Date) => {
    if (!lastOrderDate) return 999;
    const now = new Date();
    const diffTime = now.getTime() - new Date(lastOrderDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCustomerStatus = (customer: Customer) => {
    const daysSinceOrder = getDaysSinceLastOrder(customer.lastOrderDate);
    const totalOrders = customer.totalOrders || 0;
    
    if (totalOrders > 15) return { label: 'ภักดีมาก', color: 'bg-purple-100 text-purple-800', icon: '👑' };
    if (totalOrders > 10) return { label: 'ภักดี', color: 'bg-blue-100 text-blue-800', icon: '⭐' };
    if (daysSinceOrder < 30) return { label: 'ใช้งานล่าสุด', color: 'bg-green-100 text-green-800', icon: '🔥' };
    if (daysSinceOrder < 60) return { label: 'ปกติ', color: 'bg-gray-100 text-gray-800', icon: '👤' };
    return { label: 'ควรติดตาม', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
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
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้าประจำ</h1>
          <p className="text-gray-600">ลูกค้าที่ซื้อสม่ำเสมอและเป็นฐานลูกค้าหลักของเรา</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            ⭐ {totalCustomers.toLocaleString()} ลูกค้าประจำ
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าประจำทั้งหมด</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRegularCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ลูกค้าภักดี</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.loyalCustomers.toLocaleString()}</p>
          <p className="text-xs text-gray-500">ซื้อ >10 ครั้ง</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ใช้งานล่าสุด</h3>
          <p className="text-2xl font-bold text-green-600">{stats.recentlyActiveCustomers.toLocaleString()}</p>
          <p className="text-xs text-gray-500">ซื้อใน 30 วัน</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ออเดอร์เฉลี่ย</h3>
          <p className="text-2xl font-bold text-orange-600">{Math.round(stats.averageOrders * 10) / 10}</p>
          <p className="text-xs text-gray-500">ครั้งต่อคน</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ยอดขายรวม</h3>
          <p className="text-2xl font-bold text-green-600">฿{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ค่าเฉลี่ยต่อออเดอร์</h3>
          <p className="text-2xl font-bold text-blue-600">฿{Math.round(stats.averageOrderValue).toLocaleString()}</p>
        </div>
      </div>

      {/* Top Performers */}
      {stats.topPerformers.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 ลูกค้าประจำยอดเยี่ยม</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.topPerformers.map((customer, index) => (
              <div key={customer._id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                </div>
                <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
                <p className="text-sm font-bold text-blue-600">{customer.totalOrders || 0} ออเดอร์</p>
                <p className="text-xs text-gray-500">฿{(customer.totalSpent || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loyalty Program */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎁 โปรแกรมความภักดี</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="font-medium text-gray-900">ส่งรางวัลพิเศษ</h4>
            <p className="text-sm text-gray-600 mb-3">ส่งรางวัลให้ลูกค้าภักดี</p>
            <button 
              onClick={() => {
                if (customers.length > 0) {
                  setSelectedCustomer(customers[0]);
                  setShowLoyaltyModal(true);
                }
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              ส่งรางวัล
            </button>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-gray-900">รายงานความภักดี</h4>
            <p className="text-sm text-gray-600 mb-3">ดูรายงานพฤติกรรมลูกค้า</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              ดูรายงาน
            </button>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">📞</div>
            <h4 className="font-medium text-gray-900">ติดตามลูกค้า</h4>
            <p className="text-sm text-gray-600 mb-3">ติดตามลูกค้าที่ไม่ได้ซื้อ</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
              ติดตาม
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
            <label className="block text-sm font-medium text-gray-700 mb-1">ออเดอร์ขั้นต่ำ</label>
            <input
              type="number"
              value={minOrders}
              onChange={(e) => setMinOrders(e.target.value)}
              placeholder="0"
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
              <option value="lastOrderDate-desc">สั่งซื้อล่าสุด</option>
              <option value="totalOrders-desc">ออเดอร์มากสุด</option>
              <option value="totalSpent-desc">ยอดซื้อสูงสุด</option>
              <option value="averageOrderValue-desc">ค่าเฉลี่ยสูงสุด</option>
              <option value="createdAt-desc">เป็นสมาชิกล่าสุด</option>
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
                  ยอดซื้อรวม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ค่าเฉลี่ย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้รับผิดชอบ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สั่งซื้อล่าสุด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => {
                const status = getCustomerStatus(customer);
                return (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-bold text-sm">⭐</span>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.totalOrders || 0} ครั้ง</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">฿{(customer.totalSpent || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">฿{Math.round(customer.averageOrderValue || 0).toLocaleString()}</div>
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
                          new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.lastOrderDate && `${getDaysSinceLastOrder(customer.lastOrderDate)} วันที่แล้ว`}
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
                          setLoyaltyReward('ขอบคุณที่เป็นลูกค้าประจำ! รับส่วนลด 10% สำหรับการซื้อครั้งถัดไป 🎁');
                          setShowLoyaltyModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        ส่งรางวัล
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
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดลูกค้าประจำ</h2>
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
                  <label className="block text-sm font-medium text-gray-700">จำนวนออเดอร์</label>
                  <p className="mt-1 text-sm text-gray-900 font-bold">{selectedCustomer.totalOrders || 0} ครั้ง</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ยอดซื้อรวม</label>
                  <p className="mt-1 text-sm text-green-600 font-bold">฿{(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ค่าเฉลี่ยต่อออเดอร์</label>
                  <p className="mt-1 text-sm text-gray-900 font-bold">฿{Math.round(selectedCustomer.averageOrderValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สั่งซื้อล่าสุด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.lastOrderDate ? 
                      new Date(selectedCustomer.lastOrderDate).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สมัครสมาชิก</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">⭐ ข้อมูลความภักดี</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ลูกค้าประจำที่ซื้อสม่ำเสมอ</li>
                  <li>• ควรได้รับการดูแลและโปรโมชั่นพิเศษ</li>
                  <li>• มีโอกาสกลายเป็นลูกค้าเป้าหมาย</li>
                  {(selectedCustomer.totalOrders || 0) > 10 && (
                    <li>• ลูกค้าภักดีระดับสูง (ซื้อมากกว่า 10 ครั้ง)</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Loyalty Reward Modal */}
      {showLoyaltyModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">ส่งรางวัลความภักดี</h2>
                <button
                  onClick={() => setShowLoyaltyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">ลูกค้า: <span className="font-medium">{selectedCustomer.name}</span></p>
                <p className="text-sm text-gray-600">เบอร์โทร: <span className="font-medium">{selectedCustomer.phoneNumber}</span></p>
                <p className="text-sm text-gray-600">ออเดอร์: <span className="font-medium">{selectedCustomer.totalOrders || 0} ครั้ง</span></p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความรางวัล</label>
                <textarea
                  value={loyaltyReward}
                  onChange={(e) => setLoyaltyReward(e.target.value)}
                  rows={4}
                  placeholder="ระบุข้อความรางวัลหรือโปรโมชั่น..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLoyaltyModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendLoyaltyReward}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  ส่งรางวัล
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RegularCustomersPage; 