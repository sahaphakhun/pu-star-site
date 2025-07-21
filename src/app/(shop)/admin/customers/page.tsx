'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  getCustomerTypeLabel, 
  getCustomerTypeColor,
  prepareCustomerDataForExport 
} from '@/utils/customerAnalytics';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

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

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  regularCustomers: number;
  targetCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: {
    user: Customer;
    totalSpent: number;
    totalOrders: number;
  }[];
}

const CustomerManagementPage: React.FC = () => {
  const { hasPermission, isAdmin } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'regular' | 'target' | 'inactive'>('all');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Special filters for target customers
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', icon: '👥', color: 'text-gray-600' },
    { id: 'new', label: 'ลูกค้าใหม่', icon: '🆕', color: 'text-green-600' },
    { id: 'regular', label: 'ลูกค้าประจำ', icon: '⭐', color: 'text-blue-600' },
    { id: 'target', label: 'ลูกค้าเป้าหมาย', icon: '🎯', color: 'text-yellow-600' },
    { id: 'inactive', label: 'ลูกค้าห่างหาย', icon: '😴', color: 'text-gray-600' },
  ];

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        customerType: activeTab === 'all' ? '' : activeTab,
        assignedTo: assignedToFilter,
        sortBy,
        sortOrder,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(minSpent && { minSpent }),
        ...(maxSpent && { maxSpent }),
      });

      console.log('Fetching customers with params:', params.toString());
      console.log('Active tab:', activeTab);
      console.log('Search term:', searchTerm);
      
      const response = await fetch(`/api/admin/customers?${params}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        console.log('Customers loaded:', data.data.customers.length);
        setCustomers(data.data.customers);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCustomers(data.data.pagination.totalCustomers);
      } else {
        console.error('API error:', data.error);
        toast.error(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า');
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
  }, [currentPage, searchTerm, activeTab, assignedToFilter, dateRange, sortBy, sortOrder, minSpent, maxSpent]);

  const handleTabChange = (tabId: 'all' | 'new' | 'regular' | 'target' | 'inactive') => {
    setActiveTab(tabId);
    setCurrentPage(1);
    // Reset special filters when switching tabs
    if (tabId !== 'target') {
      setMinSpent('');
      setMaxSpent('');
    }
  };

  const handleAssignCustomer = async () => {
    if (!selectedCustomer || !assignedTo.trim()) {
      toast.error('กรุณาระบุผู้รับผิดชอบ');
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignedTo.trim() })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('กำหนดผู้รับผิดชอบเรียบร้อยแล้ว');
        setShowAssignModal(false);
        setAssignedTo('');
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error('เกิดข้อผิดพลาดในการกำหนดผู้รับผิดชอบ');
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        search: searchTerm,
        customerType: activeTab === 'all' ? '' : activeTab,
        assignedTo: assignedToFilter,
        sortBy,
        sortOrder,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(minSpent && { minSpent }),
        ...(maxSpent && { maxSpent }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data = await response.json();

      if (data.success && data.export) {
        // สร้าง CSV
        const csvContent = [
          Object.keys(data.data[0]).join(','),
          ...data.data.map((row: any) => Object.values(row).join(','))
        ].join('\n');

        // ดาวน์โหลดไฟล์
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customers_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast.success('ส่งออกข้อมูลเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const handleUpdateCustomerStats = async () => {
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateAllCustomerStats' })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตสถิติ');
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAssignedToFilter('');
    setDateRange({ start: '', end: '' });
    setSortBy('createdAt');
    setSortOrder('desc');
    setMinSpent('');
    setMaxSpent('');
    setCurrentPage(1);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.CUSTOMERS_VIEW}>
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการลูกค้า</h1>
          <p className="text-gray-600">ภาพรวมและจัดการข้อมูลลูกค้าทั้งหมด</p>
        </div>
        <div className="flex space-x-3">
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_STATS_UPDATE)) && (
            <button
              onClick={handleUpdateCustomerStats}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 อัปเดตสถิติ
            </button>
          )}
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_EXPORT)) && (
            <button
              onClick={handleExportCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 ส่งออก CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {stats && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.id === 'all' ? stats.totalCustomers :
                     tab.id === 'new' ? stats.newCustomers :
                     tab.id === 'regular' ? stats.regularCustomers :
                     tab.id === 'target' ? stats.targetCustomers :
                     tab.id === 'inactive' ? stats.inactiveCustomers : 0}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">
              {activeTab === 'all' ? 'ลูกค้าทั้งหมด' :
               activeTab === 'new' ? 'ลูกค้าใหม่' :
               activeTab === 'regular' ? 'ลูกค้าประจำ' :
               activeTab === 'target' ? 'ลูกค้าเป้าหมาย' :
               'ลูกค้าห่างหาย'}
            </h3>
            <p className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">ยอดขายรวม</h3>
            <p className="text-2xl font-bold text-green-600">
              ฿{customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">ค่าเฉลี่ยต่อออเดอร์</h3>
            <p className="text-2xl font-bold text-blue-600">
              ฿{Math.round(customers.reduce((sum, c) => sum + (c.averageOrderValue || 0), 0) / Math.max(customers.length, 1)).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">ออเดอร์เฉลี่ย</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / Math.max(customers.length, 1)) * 10) / 10} ครั้ง
            </p>
          </div>
        </div>
      )}

      {/* Top Customers for Target Tab */}
      {activeTab === 'target' && customers.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 ลูกค้าเป้าหมายยอดเยี่ยม</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {customers.slice(0, 5).map((customer, index) => (
              <div key={customer._id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
                <p className="text-sm font-bold text-green-600">฿{(customer.totalSpent || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{customer.totalOrders || 0} ออเดอร์</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
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
          {activeTab === 'target' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดซื้อขั้นต่ำ</label>
                <input
                  type="number"
                  value={minSpent}
                  onChange={(e) => setMinSpent(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดซื้อสูงสุด</label>
                <input
                  type="number"
                  value={maxSpent}
                  onChange={(e) => setMaxSpent(e.target.value)}
                  placeholder="ไม่จำกัด"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
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
              <option value="createdAt-desc">วันที่สมัครล่าสุด</option>
              <option value="createdAt-asc">วันที่สมัครเก่าสุด</option>
              <option value="lastOrderDate-desc">สั่งซื้อล่าสุด</option>
              <option value="totalSpent-desc">ยอดซื้อสูงสุด</option>
              <option value="totalOrders-desc">จำนวนออเดอร์มากสุด</option>
              <option value="averageOrderValue-desc">ค่าเฉลี่ยต่อออเดอร์สูงสุด</option>
              <option value="name-asc">ชื่อ A-Z</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={resetFilters}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            🔄 รีเซ็ตตัวกรอง
          </button>
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              แสดง {customers.length} จาก {totalCustomers.toLocaleString()} รายการ
            </p>
            {loading && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                กำลังโหลด...
              </div>
            )}
          </div>
        </div>
        
        {/* Debug Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p><strong>Debug Info:</strong> แท็บปัจจุบัน: {activeTab} | ค้นหา: "{searchTerm}" | จำนวนที่พบ: {customers.length}</p>
          <p>กรอง: {assignedToFilter ? `ผู้รับผิดชอบ: ${assignedToFilter}` : ''} {minSpent ? `ยอดขั้นต่ำ: ${minSpent}` : ''} {maxSpent ? `ยอดสูงสุด: ${maxSpent}` : ''}</p>
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
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ออเดอร์
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ยอดซื้อ
                </th>
                {activeTab === 'target' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าเฉลี่ย/ออเดอร์
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้รับผิดชอบ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สั่งซื้อล่าสุด
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
                      {activeTab === 'target' && (
                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-yellow-800 font-bold text-sm">🎯</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name || 'ไม่ระบุชื่อ'}</div>
                        <div className="text-sm text-gray-500">{customer.phoneNumber || 'ไม่ระบุเบอร์โทร'}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}`}>
                      {getCustomerTypeLabel(customer.customerType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{customer.totalOrders || 0} ครั้ง</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-bold text-green-600">฿{(customer.totalSpent || 0).toLocaleString()}</div>
                  </td>
                  {activeTab === 'target' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">฿{Math.round(customer.averageOrderValue || 0).toLocaleString()}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.assignedTo ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {customer.assignedTo}
                      </span>
                    ) : (
                      <span className="text-gray-400">ไม่ได้กำหนด</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.lastOrderDate ? 
                      new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : 
                      <span className="text-gray-400">ไม่เคยสั่งซื้อ</span>
                    }
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
                    {(activeTab === 'target' || activeTab === 'all') && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setAssignedTo(customer.assignedTo || '');
                          setShowAssignModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        กำหนดผู้รับผิดชอบ
                      </button>
                    )}
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
                <h2 className="text-xl font-bold text-gray-900">
                  รายละเอียดลูกค้า{selectedCustomer.customerType === 'target' ? 'เป้าหมาย' : ''}
                </h2>
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
              
              {/* Special info for target customers */}
              {selectedCustomer.customerType === 'target' && (
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">🎯 เหตุผลที่เป็นลูกค้าเป้าหมาย</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {(selectedCustomer.totalSpent || 0) > 20000 && (
                      <li>• ยอดซื้อสูงกว่า 20,000 บาท</li>
                    )}
                    {(selectedCustomer.totalOrders || 0) > 10 && (
                      <li>• สั่งซื้อมากกว่า 10 ครั้ง</li>
                    )}
                    {(selectedCustomer.averageOrderValue || 0) > 2000 && (
                      <li>• ค่าเฉลี่ยต่อออเดอร์สูงกว่า 2,000 บาท</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">กำหนดผู้รับผิดชอบ</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">ผู้รับผิดชอบ</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="ระบุชื่อผู้รับผิดชอบ"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAssignCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </PermissionGate>
  );
};

export default CustomerManagementPage; 