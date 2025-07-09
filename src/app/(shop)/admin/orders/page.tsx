'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

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
  status: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'claimed';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  taxInvoice?: TaxInvoice;
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: string;
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
  const [formData,setFormData]=useState({customerName:'',customerPhone:'',totalAmount:'',shippingFee:'0',discount:'0'});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    packing: 'bg-orange-100 text-orange-800 border-orange-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    claimed: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์',
    packing: 'แพ็คสินค้า',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
  };

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้:', error);
      toast.error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      let payload: Record<string, any> = { status: newStatus };

      // ถ้าปรับสถานะเป็นจัดส่งแล้ว ให้ถามเลขพัสดุและบริษัทขนส่ง
      if (newStatus === 'shipped') {
        const trackingNumber = prompt('กรุณาใส่เลขพัสดุ (tracking number)');
        if (!trackingNumber) {
          toast.error('กรุณาระบุเลขพัสดุ');
          return;
        }
        const shippingProvider = prompt('ระบุบริษัทขนส่ง (เช่น Kerry, Flash, J&T ฯลฯ)') || 'Unknown';
        payload = { ...payload, trackingNumber, shippingProvider };
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, ...updated } : order)));
        toast.success('อัพเดทสถานะเรียบร้อย');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const result = await new Promise<boolean>((resolve) => {
        toast(
          (t) => (
            <div className="flex flex-col">
              <span className="mb-2">คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?</span>
              <div className="flex space-x-2">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                >
                  ลบ
                </button>
                <button
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      });

      if (!result) return;

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
        toast.success('ลบคำสั่งซื้อเรียบร้อย');
        setSelectedOrder(null);
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ:', error);
      toast.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
    }
  };

  const uploadPackingImages = async (files: File[]) => {
    if (!selectedOrder) return;
    
    setUploadingImage(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`/api/orders/${selectedOrder._id}/upload-packing-image`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
        }
        
        return response.json();
      });
      
      const results = await Promise.all(uploadPromises);
      
      // อัพเดตข้อมูลออเดอร์
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === selectedOrder._id) {
            const newPackingProofs = results.map((result) => result.packingProof);
            return {
              ...order,
              packingProofs: [...(order.packingProofs || []), ...newPackingProofs],
            };
          }
          return order;
        })
      );
      
      // อัพเดต selectedOrder
      setSelectedOrder((prev) => {
        if (prev) {
          const newPackingProofs = results.map((result) => result.packingProof);
          return {
            ...prev,
            packingProofs: [...(prev.packingProofs || []), ...newPackingProofs],
          };
        }
        return prev;
      });
      
      toast.success(`อัพโหลดรูปภาพแพ็คสินค้าสำเร็จ ${results.length} รูป`);
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลด:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredAndSortedOrders = orders
    .filter((order) => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase());
      const dateObj=new Date(order.createdAt);
      let datePass=true;
      if(dateFilter==='today'){
        const now=new Date();
        datePass=dateObj.toDateString()===now.toDateString();
      }else if(dateFilter==='week'){
        const now=new Date();
        const weekAgo=new Date();weekAgo.setDate(now.getDate()-7);
        datePass=dateObj>=weekAgo && dateObj<=now;
      }else if(dateFilter==='month'){
        const now=new Date();
        datePass=dateObj.getMonth()===now.getMonth() && dateObj.getFullYear()===now.getFullYear();
      }else if(dateFilter==='custom' && customStart&&customEnd){
        datePass=dateObj>=new Date(customStart) && dateObj<=new Date(customEnd);
      }
      return matchesStatus && matchesSearch && datePass;
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

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const packing = orders.filter(o => o.status === 'packing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const claimed = orders.filter(o => o.status === 'claimed').length;
    const taxInvoiceRequests = orders.filter(o => o.taxInvoice?.requestTaxInvoice).length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'claimed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { total, pending, confirmed, packing, shipped, delivered, claimed, taxInvoiceRequests, totalRevenue };
  };

  const stats = getOrderStats();

  const exportToCSV = (data: Order[]) => {
    const header = ['OrderID','Customer','Phone','Date','Item','Unit','Qty','Price','TaxInvoice','CompanyName','TaxID'];
    const rows: string[] = [];
    data.forEach(order=>{
      order.items.forEach(item=>{
        rows.push([
          order._id.slice(-8).toUpperCase(),
          order.customerName,
          order.customerPhone,
          new Date(order.createdAt).toLocaleDateString('th-TH'),
          item.name,
          item.unitLabel||'',
          item.quantity,
          (item.unitPrice !== undefined ? item.unitPrice : item.price),
          order.taxInvoice?.requestTaxInvoice ? 'ขอใบกำกับภาษี' : '',
          order.taxInvoice?.companyName || '',
          order.taxInvoice?.taxId || ''
        ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
      });
    });
    const csvContent = [header.join(','),...rows].join('\n');
    const blob = new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href=url;
    link.download=`orders_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการคำสั่งซื้อ</h1>
            <p className="text-gray-600">ติดตามและจัดการคำสั่งซื้อทั้งหมด</p>
          </div>
          <button onClick={()=>exportToCSV(filteredAndSortedOrders)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">คำสั่งซื้อทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอดำเนินการ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">ยืนยันออเดอร์</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-orange-600">{stats.packing}</div>
            <div className="text-sm text-gray-600">แพ็คสินค้า</div>
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
            <div className="text-2xl font-bold text-gray-600">{stats.taxInvoiceRequests}</div>
            <div className="text-sm text-gray-600">ขอใบกำกับภาษี</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">฿{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">ยอดขายรวม</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือรหัสคำสั่งซื้อ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="confirmed">ยืนยันออเดอร์</option>
                <option value="packing">แพ็คสินค้า</option>
                <option value="shipped">จัดส่งแล้ว</option>
                <option value="delivered">ส่งสำเร็จ</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="claimed">เคลมสินค้า</option>
              </select>
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
          </div>
        </div>

        {/* Date filter */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={dateFilter} onChange={e=>setDateFilter(e.target.value as any)} className="border p-2 rounded">
            <option value="all">ทุกเวลา</option>
            <option value="today">วันนี้</option>
            <option value="week">7 วัน</option>
            <option value="month">เดือนนี้</option>
            <option value="custom">กำหนดเอง</option>
          </select>
          {dateFilter==='custom' && (
            <>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="border p-2 rounded"/>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="border p-2 rounded"/>
            </>
          )}
        </div>

        {/* create order button */}
        <button onClick={()=>setShowCreate(true)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">สร้างออเดอร์ใหม่</button>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสคำสั่งซื้อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การชำระ
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        {order.taxInvoice?.requestTaxInvoice && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            ใบกำกับฯ
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items.length} รายการ</div>
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {order.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}
                      </span>
                      {order.paymentMethod === 'transfer' && order.slipUrl && (
                        <div className="text-xs text-blue-600 cursor-pointer hover:text-blue-800"
                             onClick={(e) => {
                               e.stopPropagation();
                               window.open(order.slipUrl, '_blank');
                             }}>
                          ดูสลิป
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
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

        {filteredAndSortedOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h3>
              <p className="text-gray-600">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      คำสั่งซื้อ #{selectedOrder._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-gray-600">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">ที่อยู่จัดส่ง</p>
                      <p className="font-medium">{selectedOrder.customerAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลการชำระเงิน</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">วิธีการชำระเงิน</p>
                      <p className="font-medium">
                        {selectedOrder.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงินผ่านธนาคาร'}
                      </p>
                    </div>
                    {selectedOrder.paymentMethod === 'transfer' && selectedOrder.slipUrl && (
                      <button
                        onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        ดูสลิป
                      </button>
                    )}
                  </div>
                </div>

                {/* Tax Invoice Info */}
                {selectedOrder.taxInvoice?.requestTaxInvoice && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ข้อมูลใบกำกับภาษี
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">นิติบุคคล/บุคคลธรรมดา</p>
                        <p className="font-medium">{selectedOrder.taxInvoice.companyName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี</p>
                        <p className="font-medium font-mono">{selectedOrder.taxInvoice.taxId || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">ที่อยู่สำหรับออกใบกำกับภาษี</p>
                        <p className="font-medium">{selectedOrder.taxInvoice.companyAddress || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">เบอร์โทรศัพท์บริษัท</p>
                        <p className="font-medium">{selectedOrder.taxInvoice.companyPhone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">อีเมลบริษัท</p>
                        <p className="font-medium">{selectedOrder.taxInvoice.companyEmail || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}{item.unitLabel ? ` (${item.unitLabel})` : ''}</p>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <p className="text-sm text-gray-600">
                              {Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">฿{(item.unitPrice !== undefined ? item.unitPrice : item.price).toLocaleString()} x {item.quantity}</p>
                          <p className="text-sm text-gray-600">฿{((item.unitPrice !== undefined ? item.unitPrice : item.price) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                    <span className="text-lg font-semibold">ยอดรวมทั้งสิ้น</span>
                    <span className="text-xl font-bold text-blue-600">
                      ฿{selectedOrder.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Packing Images */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">รูปภาพแพ็คสินค้า</h3>
                  
                  {/* Display existing images */}
                  {selectedOrder.packingProofs && selectedOrder.packingProofs.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {selectedOrder.packingProofs.map((proof, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={proof.url}
                            alt={`รูปแพ็คสินค้า ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => window.open(proof.url, '_blank')}
                              className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                            >
                              ดูใหญ่
                            </button>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {new Date(proof.addedAt).toLocaleDateString('th-TH', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg mb-4">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>ยังไม่มีรูปภาพแพ็คสินค้า</p>
                    </div>
                  )}
                  
                  {/* Upload Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex-1">
                        <span className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกรูปภาพ (สูงสุด 10 รูป)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files);
                              if (files.length > 10) {
                                toast.error('สามารถอัพโหลดได้สูงสุด 10 รูป');
                                return;
                              }
                              setSelectedFiles(files);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          เลือกแล้ว {selectedFiles.length} ไฟล์:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {file.name}
                              <button
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => uploadPackingImages(selectedFiles)}
                      disabled={selectedFiles.length === 0 || uploadingImage}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingImage ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังอัพโหลด...
                        </div>
                      ) : (
                        `อัพโหลดรูปภาพ ${selectedFiles.length > 0 ? `(${selectedFiles.length} ไฟล์)` : ''}`
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Update */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">อัพเดทสถานะ</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusLabels)
                      .filter(([status]) => status !== 'cancelled')
                      .map(([status, label]) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(selectedOrder._id, status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedOrder.status === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* create order modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>setShowCreate(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">สร้างออเดอร์</h2>
            <div className="space-y-3">
              <input value={formData.customerName} onChange={e=>setFormData({...formData,customerName:e.target.value})} placeholder="ชื่อลูกค้า" className="w-full border p-2 rounded"/>
              <input value={formData.customerPhone} onChange={e=>setFormData({...formData,customerPhone:e.target.value})} placeholder="เบอร์โทร" className="w-full border p-2 rounded"/>
              <input type="number" value={formData.totalAmount} onChange={e=>setFormData({...formData,totalAmount:e.target.value})} placeholder="ยอดสินค้า (บาท)" className="w-full border p-2 rounded"/>
              <input type="number" value={formData.shippingFee} onChange={e=>setFormData({...formData,shippingFee:e.target.value})} placeholder="ค่าจัดส่ง" className="w-full border p-2 rounded"/>
              <input type="number" value={formData.discount} onChange={e=>setFormData({...formData,discount:e.target.value})} placeholder="ส่วนลด" className="w-full border p-2 rounded"/>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button>
              <button onClick={async()=>{
                const sub=parseFloat(formData.totalAmount||'0');
                const shipping=parseFloat(formData.shippingFee||'0');
                const disc=parseFloat(formData.discount||'0');
                const total=sub+shipping-disc;
                const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerName:formData.customerName,customerPhone:formData.customerPhone,items:[],shippingFee:shipping,discount:disc,totalAmount:total})});
                if(res.ok){toast.success('สร้างออเดอร์แล้ว');setShowCreate(false);fetchOrders();}
                else {const d=await res.json();toast.error(d.error||'ผิดพลาด');}
              }} className="px-4 py-2 bg-blue-600 text-white rounded">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage; 