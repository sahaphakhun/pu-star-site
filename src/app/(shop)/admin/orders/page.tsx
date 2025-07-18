'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import PackingImageGallery from '@/components/PackingImageGallery';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [key: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

interface TaxInvoice {
  requestTaxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface ClaimInfo {
  claimDate: string;
  claimReason: string;
  claimImages: string[];
  claimStatus: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
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
  discount?: number;
  status: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'claimed';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  taxInvoice?: TaxInvoice;
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: Date;
  }>;
  claimInfo?: ClaimInfo;
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    totalAmount: '',
    shippingFee: '0',
    discount: '0'
  });
  
  // States for order editing
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    trackingNumber: '',
    shippingProvider: ''
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-orange-100 text-orange-800 border-orange-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    claimed: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    ready: 'พร้อมส่ง',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
  };

  const statusIcons = {
    pending: '⏳',
    confirmed: '✅',
    ready: '📦',
    shipped: '🚚',
    delivered: '🎉',
    cancelled: '❌',
    claimed: '🔁',
  };

  const stats = orders.reduce((acc, order) => {
    acc.total = orders.length;
    acc[order.status] = (acc[order.status] || 0) + 1;
    if (order.status === 'delivered') {
      acc.totalRevenue += order.totalAmount;
    }
    if (order.taxInvoice?.requestTaxInvoice) {
      acc.taxInvoiceRequests = (acc.taxInvoiceRequests || 0) + 1;
    }
    return acc;
  }, {
    total: 0,
    pending: 0,
    confirmed: 0,
    ready: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    claimed: 0,
    totalRevenue: 0,
    taxInvoiceRequests: 0,
  });

  const filteredAndSortedOrders = orders
    .filter(order => {
      const matchesSearch = !searchTerm || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = orderDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= weekAgo;
            break;
          case 'month':
            matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            break;
          case 'custom':
            if (customStart && customEnd) {
              const start = new Date(customStart);
              const end = new Date(customEnd);
              matchesDate = orderDate >= start && orderDate <= end;
            }
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const exportToCSV = (orders: Order[]) => {
    const csvContent = [
      ['รหัสออเดอร์', 'ลูกค้า', 'เบอร์โทร', 'วันที่', 'รายการ', 'ยอดรวม', 'สถานะ', 'การชำระเงิน'].join(','),
      ...orders.map(order => [
        `#${order._id.slice(-8).toUpperCase()}`,
        order.customerName,
        order.customerPhone,
        new Date(order.createdAt).toLocaleDateString('th-TH'),
        `${order.items.length} รายการ`,
        order.totalAmount,
        statusLabels[order.status],
        order.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const createOrder = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.totalAmount) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          totalAmount: Number(formData.totalAmount),
          shippingFee: Number(formData.shippingFee),
          discount: Number(formData.discount),
          paymentMethod: 'cod',
          items: [{
            productId: 'manual',
            name: 'สินค้าที่สร้างด้วยตนเอง',
            price: Number(formData.totalAmount),
            quantity: 1
          }]
        })
      });

      if (res.ok) {
        toast.success('สร้างออเดอร์สำเร็จ');
        setShowCreate(false);
        setFormData({
          customerName: '',
          customerPhone: '',
          totalAmount: '',
          shippingFee: '0',
          discount: '0'
        });
        fetchOrders();
      } else {
        const d = await res.json();
        toast.error(d.error || 'ผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    }
  };

  const uploadPackingImages = async (orderId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      const res = await fetch(`/api/orders/${orderId}/upload-packing-image`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const result = await res.json();
        return result;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, updates: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (res.ok) {
        const updatedOrder = await res.json();
        return updatedOrder;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดท');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    try {
      setLoading(true);
      
      // อัพโหลดรูปก่อน (ถ้ามี)
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        toast.loading('กำลังอัพโหลดรูปภาพ...');
        await uploadPackingImages(editingOrder._id, imageFiles);
        setUploadingImages(false);
      }

      // อัพเดทข้อมูลออเดอร์
      const updates: any = {};
      if (editForm.status && editForm.status !== editingOrder.status) {
        updates.status = editForm.status;
      }
      if (editForm.trackingNumber && editForm.trackingNumber !== editingOrder.trackingNumber) {
        updates.trackingNumber = editForm.trackingNumber;
      }
      if (editForm.shippingProvider && editForm.shippingProvider !== editingOrder.shippingProvider) {
        updates.shippingProvider = editForm.shippingProvider;
      }

      if (Object.keys(updates).length > 0) {
        await updateOrderStatus(editingOrder._id, updates);
      }

      toast.success('อัพเดทออเดอร์สำเร็จ');
      
      // รีเซ็ตฟอร์มและรีเฟรชข้อมูล
      setEditingOrder(null);
      setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
      setImageFiles([]);
      setSelectedOrder(null);
      await fetchOrders();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const startEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      shippingProvider: order.shippingProvider || ''
    });
    setImageFiles([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImageCount = editingOrder?.packingProofs?.length || 0;
    
    if (currentImageCount + files.length > 10) {
      toast.error(`สามารถอัพโหลดได้สูงสุด ${10 - currentImageCount} รูป`);
      return;
    }
    
    setImageFiles(files);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการออเดอร์</h1>
            <p className="text-gray-600">ติดตามและจัดการคำสั่งซื้อทั้งหมด</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              + สร้างออเดอร์
            </button>
            <button 
              onClick={() => exportToCSV(filteredAndSortedOrders)} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Quick Status Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              📋 ทั้งหมด ({stats.total})
            </button>
            
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {statusIcons[status]} {label} ({stats[status] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">ออเดอร์ทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอดำเนินการ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <div className="text-sm text-gray-600">จัดส่งแล้ว</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600">ส่งสำเร็จ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-pink-600">{stats.claimed}</div>
            <div className="text-sm text-gray-600">เคลมสินค้า</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">฿{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">ยอดขายรวม</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อลูกค้า, เบอร์โทร, หรือรหัสออเดอร์"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เรียงลำดับ</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">ใหม่สุด</option>
                <option value="oldest">เก่าสุด</option>
                <option value="amount-high">ยอดสูงสุด</option>
                <option value="amount-low">ยอดต่ำสุด</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงวันที่</label>
              <select 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value as any)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทุกเวลา</option>
                <option value="today">วันนี้</option>
                <option value="week">7 วันย้อนหลัง</option>
                <option value="month">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Orders List/Cards - Responsive Design */}
        <div className="space-y-4">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบออเดอร์</h3>
                <p className="text-gray-600">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ออเดอร์
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ลูกค้า
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          รายการ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ยอดรวม
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedOrders.map((order) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                #{order._id.slice(-8).toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('th-TH')}
                              </span>
                              {order.taxInvoice?.requestTaxInvoice && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                  🧾 ใบกำกับฯ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">{order.customerPhone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.items.length} รายการ</div>
                            <div className="text-xs text-gray-500">
                              {order.items.slice(0, 1).map(item => item.name).join(', ')}
                              {order.items.length > 1 && `... +${order.items.length - 1}`}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {order.paymentMethod === 'cod' ? '💰 COD' : '🏦 โอนเงิน'}
                              </span>
                              {order.packingProofs && order.packingProofs.length > 0 && (
                                <span className="text-xs text-blue-600">
                                  📷 {order.packingProofs.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ฿{order.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                              {statusIcons[order.status]} {statusLabels[order.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                startEditOrder(order);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              จัดการ
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {filteredAndSortedOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                            {statusIcons[order.status]} {statusLabels[order.status]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ฿{order.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'cod' ? '💰 COD' : '🏦 โอนเงิน'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} รายการ
                            {order.packingProofs && order.packingProofs.length > 0 && (
                              <span className="text-blue-600 ml-2">📷 {order.packingProofs.length}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            startEditOrder(order);
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          จัดการ
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">สร้างออเดอร์ใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดรวม</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={createOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  สร้างออเดอร์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">จัดการออเดอร์ #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditingOrder(null);
                    setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
                    setImageFiles([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ข้อมูลออเดอร์ */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">ข้อมูลออเดอร์</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ลูกค้า</label>
                        <p className="text-gray-900">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">เบอร์โทร</label>
                        <p className="text-gray-900">{selectedOrder.customerPhone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
                        <p className="text-gray-900">{selectedOrder.customerAddress}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">การชำระเงิน</label>
                        <p className="text-gray-900">
                          {selectedOrder.paymentMethod === 'cod' ? '💰 เก็บเงินปลายทาง' : '🏦 โอนเงิน'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ค่าจัดส่ง</label>
                        <p className="text-gray-900">฿{selectedOrder.shippingFee.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ส่วนลด</label>
                        <p className="text-gray-900">฿{(selectedOrder.discount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ยอดรวม</label>
                        <p className="text-gray-900 font-bold">฿{selectedOrder.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่สั่งซื้อ</label>
                        <p className="text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    
                    {/* แสดงข้อมูลใบกำกับภาษี ถ้ามี */}
                    {selectedOrder.taxInvoice?.requestTaxInvoice && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">ข้อมูลใบกำกับภาษี</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">ชื่อบริษัท</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">เลขประจำตัวผู้เสียภาษี</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.taxId}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500">ที่อยู่บริษัท</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyAddress}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">เบอร์โทร</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyPhone}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">อีเมล</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyEmail}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รายการสินค้า</label>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-medium">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* รูปหลักฐานการแพ็ก */}
                  <div>
                    <PackingImageGallery
                      orderId={selectedOrder._id}
                      packingProofs={selectedOrder.packingProofs || []}
                      isAdmin={true}
                      onImagesUpdated={(updatedProofs) => {
                        setSelectedOrder(prev => prev ? { ...prev, packingProofs: updatedProofs } : null);
                        // รีเฟรชข้อมูลออเดอร์
                        fetchOrders();
                      }}
                    />
                  </div>
                </div>

                {/* ฟอร์มแก้ไข */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">แก้ไขสถานะออเดอร์</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะปัจจุบัน</label>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[selectedOrder.status]}`}>
                          {statusIcons[selectedOrder.status]} {statusLabels[selectedOrder.status]}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เปลี่ยนสถานะ</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- เลือกสถานะใหม่ --</option>
                          <option value="pending">รอดำเนินการ</option>
                          <option value="confirmed">ยืนยันออเดอร์แล้ว</option>
                          <option value="ready">พร้อมส่ง</option>
                          <option value="shipped">จัดส่งแล้ว</option>
                          <option value="delivered">ส่งสำเร็จ</option>
                          <option value="cancelled">ยกเลิก</option>
                          <option value="claimed">เคลมสินค้า</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เลขพัสดุ</label>
                        <input
                          type="text"
                          value={editForm.trackingNumber}
                          onChange={(e) => setEditForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                          placeholder="ใส่เลขพัสดุ"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ส่ง/ขนส่ง</label>
                        <input
                          type="text"
                          value={editForm.shippingProvider}
                          onChange={(e) => setEditForm(prev => ({ ...prev, shippingProvider: e.target.value }))}
                          placeholder="เช่น Kerry, Flash Express"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>



                  {/* ปุ่มบันทึก */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setEditingOrder(null);
                        setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
                        setImageFiles([]);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveOrder}
                      disabled={loading || uploadingImages}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading || uploadingImages ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;