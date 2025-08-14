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
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const [dateField, setDateField] = useState<'createdAt' | 'lastOrderDate'>('lastOrderDate');
  
  // Special filters for target customers
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Mobile dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, color: 'text-gray-600' },
    { id: 'new', label: 'ลูกค้าใหม่', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'text-green-600' },
    { id: 'regular', label: 'ลูกค้าประจำ', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.691h4.915c.971 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.928 10.1c-.783-.57-.383-1.81.588-1.81h4.915a1 1 0 00.95-.691l1.519-4.674z" /></svg>, color: 'text-blue-600' },
    { id: 'target', label: 'ลูกค้าเป้าหมาย', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: 'text-yellow-600' },
    { id: 'inactive', label: 'ลูกค้าห่างหาย', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'text-gray-600' },
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
        includeAdmins: includeAdmins ? '1' : '0',
        dateField,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(minSpent && { minSpent }),
        ...(maxSpent && { maxSpent }),
      });

      console.log('Fetching customers with params:', params.toString());
      console.log('Active tab:', activeTab);
      console.log('Search term:', searchTerm);
      
      const response = await fetch(`/api/admin/customers?${params}`, { credentials: 'include' });
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.relative')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

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
      const response = await fetch(`/api/admin/customers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedCustomer._id, updates: { assignedTo: assignedTo.trim() } }),
        credentials: 'include'
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
        includeAdmins: includeAdmins ? '1' : '0',
        dateField,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(minSpent && { minSpent }),
        ...(maxSpent && { maxSpent }),
      });

      const response = await fetch(`/api/admin/customers?${params}`, { credentials: 'include' });
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

  const handleUpdateAllCustomerStats = async () => {
    try {
      toast.loading('กำลังอัปเดตสถิติลูกค้าทั้งหมด...', { id: 'updateStats' });
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateAllCustomerStats' }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message, { id: 'updateStats' });
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถิติ', { id: 'updateStats' });
      }
    } catch (error) {
      console.error('Error updating customer stats:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: 'updateStats' });
    }
  };

  const handleUpdateCustomerStats = async (customerId: string) => {
    try {
      toast.loading('กำลังอัปเดตสถิติลูกค้า...', { id: `updateStats_${customerId}` });
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCustomerStatsById', customerId }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('อัปเดตสถิติลูกค้าสำเร็จแล้ว', { id: `updateStats_${customerId}` });
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถิติ', { id: `updateStats_${customerId}` });
      }
    } catch (error) {
      console.error('Error updating customer stats:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: `updateStats_${customerId}` });
    }
  };

  const handleSyncOrdersToUser = async (customerId: string) => {
    try {
      toast.loading('กำลังซิงค์ออเดอร์...', { id: `syncOrders_${customerId}` });
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncOrdersToUser', customerId }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message, { id: `syncOrders_${customerId}` });
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการซิงค์ออเดอร์', { id: `syncOrders_${customerId}` });
      }
    } catch (error) {
      console.error('Error syncing orders to user:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: `syncOrders_${customerId}` });
    }
  };

  const handleSyncAllOrdersToUsers = async () => {
    try {
      toast.loading('กำลังซิงค์ออเดอร์ทั้งหมด...', { id: 'syncAllOrders' });
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncAllOrdersToUsers' }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message, { id: 'syncAllOrders' });
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการซิงค์ออเดอร์ทั้งหมด', { id: 'syncAllOrders' });
      }
    } catch (error) {
      console.error('Error syncing all orders to users:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: 'syncAllOrders' });
    }
  };

  const handleSyncCustomerName = async (customerId: string, customerPhone: string) => {
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'syncCustomerName',
          customerId,
          customerPhone 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('ซิงค์ชื่อลูกค้าสำเร็จแล้ว');
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการซิงค์ชื่อ');
      }
    } catch (error) {
      console.error('Error syncing customer name:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleSyncAllCustomerNames = async () => {
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'syncAllCustomerNames'
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`ซิงค์ชื่อลูกค้าสำเร็จ ${data.updated} คน`);
        fetchCustomers(); // รีเฟรชข้อมูล
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการซิงค์ชื่อ');
      }
    } catch (error) {
      console.error('Error syncing all customer names:', error);
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
    setIncludeAdmins(false);
    setDateField('lastOrderDate');
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
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการลูกค้า</h1>
          <p className="text-gray-600">ภาพรวมและจัดการข้อมูลลูกค้าทั้งหมด</p>
        </div>
        <div className="flex space-x-3">
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_STATS_UPDATE)) && (
            <button
              onClick={handleUpdateAllCustomerStats}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              อัปเดตสถิติลูกค้าทั้งหมด
            </button>
          )}
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_STATS_UPDATE)) && (
            <button
              onClick={handleSyncAllOrdersToUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ml-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              ซิงค์ออเดอร์ทั้งหมด
            </button>
          )}
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_EXPORT)) && (
            <button
              onClick={handleExportCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ส่งออก CSV
            </button>
          )}
          {(isAdmin || hasPermission(PERMISSIONS.CUSTOMERS_EDIT)) && (
            <button
              onClick={handleSyncAllCustomerNames}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ซิงค์ชื่อลูกค้าทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="border-b border-gray-200">
          {/* Desktop: แสดงแท็บแบบเดิม */}
          <nav className="hidden md:flex space-x-8 px-6" aria-label="Tabs">
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

          {/* Mobile: แสดง dropdown */}
          <div className="md:hidden px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่ลูกค้า</label>
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                    {stats && ` (${
                      tab.id === 'all' ? stats.totalCustomers :
                      tab.id === 'new' ? stats.newCustomers :
                      tab.id === 'regular' ? stats.regularCustomers :
                      tab.id === 'target' ? stats.targetCustomers :
                      tab.id === 'inactive' ? stats.inactiveCustomers : 0
                    })`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* แสดงสถิติของแท็บที่เลือกในมือถือ */}
            {stats && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {tabs.find(tab => tab.id === activeTab)?.icon}
                    </span>
                    <span className="font-medium text-gray-900">
                      {tabs.find(tab => tab.id === activeTab)?.label}
                    </span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold rounded-full">
                    {activeTab === 'all' ? stats.totalCustomers :
                     activeTab === 'new' ? stats.newCustomers :
                     activeTab === 'regular' ? stats.regularCustomers :
                     activeTab === 'target' ? stats.targetCustomers :
                     activeTab === 'inactive' ? stats.inactiveCustomers : 0} คน
                  </span>
                </div>
              </div>
            )}
          </div>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  ลูกค้าเป้าหมายยอดเยี่ยม
                </h3>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ฟิลด์วันที่สำหรับกรอง</label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as 'createdAt' | 'lastOrderDate')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lastOrderDate">วันที่สั่งซื้อล่าสุด</option>
              <option value="createdAt">วันที่สมัคร</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={includeAdmins}
                onChange={(e) => setIncludeAdmins(e.target.checked)}
              />
              <span className="text-sm text-gray-700">รวมแอดมิน</span>
            </label>
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
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเซ็ตตัวกรอง
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
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้รับผิดชอบ
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถิติ
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ออเดอร์ล่าสุด
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะชื่อ
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name || 'ไม่มีชื่อ'}
                        </div>
                        <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-400">{customer.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}`}>
                      {getCustomerTypeLabel(customer.customerType)}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.assignedTo ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {customer.assignedTo}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">ไม่ระบุ</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="font-medium">{customer.totalOrders || 0} ครั้ง</div>
                      <div className="font-bold text-green-600">฿{(customer.totalSpent || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">฿{Math.round(customer.averageOrderValue || 0).toLocaleString()}/ครั้ง</div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.lastOrderDate ? 
                      new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : 
                      <span className="text-gray-400">ไม่เคยสั่งซื้อ</span>
                    }
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.name === 'ลูกค้า' || !customer.name || customer.name === customer.phoneNumber ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ต้องซิงค์ชื่อ
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ชื่อถูกต้อง
                      </span>
                    )}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Desktop: แสดงปุ่มแบบข้อความ */}
                    <div className="hidden md:block">
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
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          กำหนดผู้รับผิดชอบ
                        </button>
                      )}
                      {(customer.name === 'ลูกค้า' || !customer.name || customer.name === customer.phoneNumber) && (
                        <button
                          onClick={() => handleSyncCustomerName(customer._id, customer.phoneNumber)}
                          className="text-purple-600 hover:text-purple-900"
                          title="ซิงค์ชื่อจากออเดอร์"
                        >
                          ซิงค์ชื่อ
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateCustomerStats(customer._id)}
                        className="text-orange-600 hover:text-orange-900 ml-2"
                        title="อัปเดตสถิติลูกค้า"
                      >
                        อัปเดตสถิติ
                      </button>
                      <button
                        onClick={() => handleSyncOrdersToUser(customer._id)}
                        className="text-indigo-600 hover:text-indigo-900 ml-2"
                        title="ซิงค์ออเดอร์"
                      >
                        ซิงค์ออเดอร์
                      </button>
                    </div>
                    
                    {/* Mobile: แสดงปุ่มแบบไอคอน */}
                    <div className="md:hidden flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full"
                        title="ดูรายละเอียด"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {(activeTab === 'target' || activeTab === 'all') && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setAssignedTo(customer.assignedTo || '');
                            setShowAssignModal(true);
                          }}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-full"
                          title="กำหนดผู้รับผิดชอบ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                      )}
                      {(customer.name === 'ลูกค้า' || !customer.name || customer.name === customer.phoneNumber) && (
                        <button
                          onClick={() => handleSyncCustomerName(customer._id, customer.phoneNumber)}
                          className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-full"
                          title="ซิงค์ชื่อจากออเดอร์"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateCustomerStats(customer._id)}
                        className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-full"
                        title="อัปเดตสถิติลูกค้า"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleSyncOrdersToUser(customer._id)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full"
                        title="ซิงค์ออเดอร์"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </button>
                    </div>
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">สถานะชื่อ</label>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedCustomer.name === 'ลูกค้า' || !selectedCustomer.name || selectedCustomer.name === selectedCustomer.phoneNumber ? (
                      <>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          ต้องซิงค์ชื่อ
                        </span>
                        <button
                          onClick={() => {
                            handleSyncCustomerName(selectedCustomer._id, selectedCustomer.name || '');
                            setShowDetailModal(false);
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          คลิกเพื่อซิงค์ชื่อ
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ชื่อถูกต้อง
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Special info for target customers */}
              {selectedCustomer.customerType === 'target' && (
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  เหตุผลที่เป็นลูกค้าเป้าหมาย
                </h3>
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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