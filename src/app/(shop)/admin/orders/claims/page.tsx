'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [key: string]: string };
  unitLabel?: string;
  unitPrice?: number;
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
  status: 'claimed';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  claimInfo?: ClaimInfo;
}

const AdminClaimsPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [responding, setResponding] = useState(false);
  const [responseForm, setResponseForm] = useState({
    claimStatus: '',
    adminResponse: '',
    newOrderStatus: 'delivered' // สถานะออเดอร์ใหม่ถ้าอนุมัติเคลม
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        // กรองเฉพาะออเดอร์ที่มีการเคลม
        const claimOrders = data.orders ? data.orders.filter((order: Order) => 
          order.status === 'claimed' && order.claimInfo
        ) : [];
        setOrders(claimOrders);
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลเคลมได้:', error);
      toast.error('ไม่สามารถดึงข้อมูลเคลมได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClaimResponse = async () => {
    if (!selectedOrder || !responseForm.claimStatus || !responseForm.adminResponse.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setResponding(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}/claim-response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimStatus: responseForm.claimStatus,
          adminResponse: responseForm.adminResponse,
          newOrderStatus: responseForm.claimStatus === 'approved' ? responseForm.newOrderStatus : undefined
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchOrders(); // รีเฟรชรายการ
        setSelectedOrder(null);
        setResponseForm({
          claimStatus: '',
          adminResponse: '',
          newOrderStatus: 'delivered'
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการตอบกลับ');
      }
    } catch (error) {
      console.error('Error responding to claim:', error);
      toast.error('เกิดข้อผิดพลาดในการตอบกลับ');
    } finally {
      setResponding(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateObj = new Date(order.claimInfo?.claimDate || order.createdAt);
    let datePass = true;
    
    if (dateFilter === 'today') {
      const now = new Date();
      datePass = dateObj.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      datePass = dateObj >= weekAgo && dateObj <= now;
    } else if (dateFilter === 'month') {
      const now = new Date();
      datePass = dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      datePass = dateObj >= new Date(customStart) && dateObj <= new Date(customEnd);
    }
    
    return matchesSearch && datePass;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการเคลมสินค้า</h1>
          <p className="text-gray-600">ออเดอร์ที่ลูกค้าขอเคลมสินค้า</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-orange-600">{filteredOrders.length}</div>
            <div className="text-sm text-gray-600">เคลมรอดำเนินการ</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-red-600">
              ฿{filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">มูลค่าเคลมรวม</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">
              {filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length) : 0}
            </div>
            <div className="text-sm text-gray-600">มูลค่าเฉลี่ยต่อเคลม</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือรหัสออเดอร์"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">กรองตามวัน</label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value as any)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทุกเวลา</option>
                <option value="today">วันนี้</option>
                <option value="week">7 วันล่าสุด</option>
                <option value="month">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">จาก</label>
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ถึง</label>
                  <input 
                    type="date" 
                    value={customEnd} 
                    onChange={(e) => setCustomEnd(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสออเดอร์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่เคลม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รูปภาพ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
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
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 mt-1">
                          🔄 รอตอบกลับ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.claimInfo?.claimDate || order.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.claimInfo?.claimImages && order.claimInfo.claimImages.length > 0 ? (
                        <span className="text-blue-600">
                          📷 {order.claimInfo.claimImages.length} รูป
                        </span>
                      ) : (
                        <span className="text-gray-400">ไม่มีรูป</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ตอบกลับ
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบเคลมสินค้า</h3>
              <p className="text-gray-600">ไม่มีออเดอร์ที่ขอเคลมในช่วงเวลาที่เลือก</p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Response Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  ตอบกลับเคลม #{selectedOrder._id.slice(-8).toUpperCase()}
                </h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setResponseForm({ claimStatus: '', adminResponse: '', newOrderStatus: 'delivered' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ข้อมูลการเคลม */}
                <div className="space-y-6">
                  {/* ข้อมูลออเดอร์ */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลออเดอร์</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>ลูกค้า:</strong> {selectedOrder.customerName}</p>
                      <p><strong>เบอร์โทร:</strong> {selectedOrder.customerPhone}</p>
                      <p><strong>ที่อยู่:</strong> {selectedOrder.customerAddress}</p>
                      <p><strong>ยอดรวม:</strong> ฿{selectedOrder.totalAmount.toLocaleString()}</p>
                      <p><strong>การชำระเงิน:</strong> {selectedOrder.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}</p>
                    </div>
                  </div>

                  {/* รายการสินค้า */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-gray-600">จำนวน: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">฿{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ข้อมูลการเคลม */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3">ข้อมูลการเคลม</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>วันที่เคลม:</strong> {new Date(selectedOrder.claimInfo?.claimDate || '').toLocaleDateString('th-TH')}</p>
                      <p><strong>เหตุผล:</strong></p>
                      <div className="bg-white p-3 rounded border">
                        {selectedOrder.claimInfo?.claimReason}
                      </div>
                    </div>
                  </div>

                  {/* รูปภาพเคลม */}
                  {selectedOrder.claimInfo?.claimImages && selectedOrder.claimInfo.claimImages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">รูปภาพประกอบการเคลม</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedOrder.claimInfo.claimImages.map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={imageUrl}
                              alt={`รูปภาพเคลม ${index + 1}`}
                              fill
                              className="object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(imageUrl)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ฟอร์มตอบกลับ */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-4">ตอบกลับการเคลม</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          การตัดสินใจ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={responseForm.claimStatus}
                          onChange={(e) => setResponseForm(prev => ({ ...prev, claimStatus: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- เลือกการตัดสินใจ --</option>
                          <option value="approved">อนุมัติเคลม</option>
                          <option value="rejected">ปฏิเสธเคลม</option>
                        </select>
                      </div>

                      {responseForm.claimStatus === 'approved' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สถานะออเดอร์ใหม่
                          </label>
                          <select
                            value={responseForm.newOrderStatus}
                            onChange={(e) => setResponseForm(prev => ({ ...prev, newOrderStatus: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="delivered">ส่งสำเร็จ (รับเคลม)</option>
                            <option value="cancelled">ยกเลิกออเดอร์</option>
                            <option value="ready">ส่งสินค้าใหม่</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ข้อความตอบกลับ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={responseForm.adminResponse}
                          onChange={(e) => setResponseForm(prev => ({ ...prev, adminResponse: e.target.value }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="กรุณาระบุข้อความตอบกลับถึงลูกค้า..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            setResponseForm({ claimStatus: '', adminResponse: '', newOrderStatus: 'delivered' });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleClaimResponse}
                          disabled={responding || !responseForm.claimStatus || !responseForm.adminResponse.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {responding ? 'กำลังส่ง...' : 'ส่งการตอบกลับ'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="รูปภาพเคลม"
                width={800}
                height={600}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClaimsPage; 