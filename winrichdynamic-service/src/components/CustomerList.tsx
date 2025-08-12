'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  taxId?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string;
  creditLimit?: number;
  notes?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onDelete,
  onRefresh,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Filter และ Sort ลูกค้า
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm) ||
        (customer.taxId && customer.taxId.includes(searchTerm)) ||
        (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || customer.customerType === filterType;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && customer.isActive) ||
        (filterStatus === 'inactive' && !customer.isActive);
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Customer];
      let bValue: any = b[sortBy as keyof Customer];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDelete = async (customerId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบลูกค้านี้?')) {
      return;
    }

    setDeleteLoading(customerId);
    try {
      await onDelete(customerId);
      toast.success('ลบลูกค้าเรียบร้อยแล้ว');
      onRefresh();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบลูกค้า');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'regular': return 'bg-green-100 text-green-800';
      case 'target': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'new': return 'ลูกค้าใหม่';
      case 'regular': return 'ลูกค้าปกติ';
      case 'target': return 'ลูกค้าเป้าหมาย';
      case 'inactive': return 'ไม่ใช้งาน';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header และ Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">รายการลูกค้า</h2>
            <p className="text-sm text-gray-600 mt-1">
              รวม {filteredCustomers.length} รายการ
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {/* Search และ Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="ค้นหาลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกประเภท</option>
              <option value="new">ลูกค้าใหม่</option>
              <option value="regular">ลูกค้าปกติ</option>
              <option value="target">ลูกค้าเป้าหมาย</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
          
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">วันที่ล่าสุด</option>
              <option value="createdAt-asc">วันที่เก่าสุด</option>
              <option value="name-asc">ชื่อ A-Z</option>
              <option value="name-desc">ชื่อ Z-A</option>
              <option value="customerType-asc">ประเภท A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ข้อมูลติดต่อ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ประเภท
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้รับผิดชอบ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่สร้าง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {filteredCustomers.map((customer) => (
                <motion.tr
                  key={customer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      {customer.companyName && (
                        <div className="text-sm text-gray-500">
                          {customer.companyName}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phoneNumber}
                    </div>
                    {customer.email && (
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                    )}
                    {customer.taxId && (
                      <div className="text-sm text-gray-500">
                        Tax ID: {customer.taxId}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}`}>
                      {getCustomerTypeLabel(customer.customerType)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.assignedTo || '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        disabled={deleteLoading === customer._id}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded disabled:opacity-50"
                      >
                        {deleteLoading === customer._id ? 'กำลังลบ...' : 'ลบ'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'ไม่พบลูกค้าที่ตรงกับเงื่อนไขการค้นหา' 
                : 'ยังไม่มีข้อมูลลูกค้า'
              }
            </div>
            <div className="text-gray-400 text-sm mt-2">
              ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มลูกค้าใหม่
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
