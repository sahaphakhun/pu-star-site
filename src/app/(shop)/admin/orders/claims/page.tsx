'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface ClaimInfo {
  claimDate: string;
  claimReason: string;
  claimImages: string[];
  claimStatus: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  responseDate?: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'cod' | 'transfer';
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  status: string;
  createdAt: string;
  claimInfo?: ClaimInfo;
}

const AdminClaimsPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [responseForm, setResponseForm] = useState({
    claimStatus: '',
    adminResponse: '',
    newOrderStatus: 'delivered'
  });

  const fetchClaimedOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        // กรองเฉพาะออเดอร์ที่มีข้อมูลการเคลม (ทุกสถานะ)
        const claimedOrders = data.orders?.filter((order: Order) => 
          (order.claimInfo && order.claimInfo.claimDate) || 
          ['claimed', 'claim_approved', 'claim_rejected'].includes(order.status)
        ) || [];
        setOrders(claimedOrders);
      }
    } catch (error) {
      console.error('Error fetching claimed orders:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการเคลม');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimResponse = async () => {
    if (!selectedOrder || !responseForm.claimStatus || !responseForm.adminResponse.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setResponding(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}/claim-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: responseForm.claimStatus === 'approved' ? 'approve' : 'reject',
          adminResponse: responseForm.adminResponse
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        
        // รีเฟรชข้อมูลจาก API เพื่อให้แน่ใจว่าได้ข้อมูลล่าสุด
        refreshData();
        
        // ปิด modal และรีเซ็ตฟอร์ม
        setSelectedOrder(null);
        setResponseForm({ claimStatus: '', adminResponse: '', newOrderStatus: 'delivered' });
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการตอบกลับ');
      }
    } catch (error) {
      console.error('Error responding to claim:', error);
      toast.error('เกิดข้อผิดพลาดในการตอบกลับการเคลม');
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    fetchClaimedOrders();
  }, []);

  // กรองออเดอร์ตามสถานะการเคลม
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    
    if (statusFilter === 'pending') {
      return order.status === 'claimed' || order.claimInfo?.claimStatus === 'pending';
    }
    
    if (statusFilter === 'approved') {
      return order.status === 'claim_approved' || order.claimInfo?.claimStatus === 'approved';
    }
    
    if (statusFilter === 'rejected') {
      return order.status === 'claim_rejected' || order.claimInfo?.claimStatus === 'rejected';
    }
    
    return true;
  });

  const statusLabels: Record<string, string> = {
    claimed: 'รอตอบกลับ',
    claim_approved: 'อนุมัติแล้ว',
    claim_rejected: 'ปฏิเสธแล้ว'
  };

  // ฟังก์ชันสำหรับรีเฟรชข้อมูลหลังจากตอบกลับ
  const refreshData = () => {
    fetchClaimedOrders();
  };

  const statusColors: Record<string, string> = {
    claimed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    claim_approved: 'bg-green-100 text-green-800 border-green-200',
    claim_rejected: 'bg-red-100 text-red-800 border-red-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูลการเคลม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการการเคลม</h1>
          <p className="text-gray-600">ตรวจสอบและตอบกลับการเคลมสินค้าจากลูกค้า</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'claimed').length}
                </p>
                <p className="text-gray-600">รอตอบกลับ</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'claim_approved').length}
                </p>
                <p className="text-gray-600">อนุมัติแล้ว</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.status === 'claim_rejected').length}
                </p>
                <p className="text-gray-600">ปฏิเสธแล้ว</p>
              </div>
            </div>
          </div>
        </div>

        {/* Claims List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'ไม่มีการเคลม' : 
                 statusFilter === 'pending' ? 'ไม่มีการเคลมที่รอตอบกลับ' :
                 statusFilter === 'approved' ? 'ไม่มีการเคลมที่อนุมัติแล้ว' :
                 'ไม่มีการเคลมที่ปฏิเสธแล้ว'}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' ? 'ยังไม่มีการเคลมสินค้าจากลูกค้า' : 
                 `ไม่มีการเคลมในสถานะ "${statusFilter === 'pending' ? 'รอตอบกลับ' : 
                 statusFilter === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}"`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      เหตุผลเคลม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่เคลม
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
                          <span className="text-sm text-gray-500">
                            ฿{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {order.claimInfo?.claimReason ? (
                            order.claimInfo.claimReason.length > 60 
                              ? order.claimInfo.claimReason.substring(0, 60) + '...'
                              : order.claimInfo.claimReason
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.claimInfo?.claimDate 
                          ? new Date(order.claimInfo.claimDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              timeZone: 'Asia/Bangkok'
                            })
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
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
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              รายละเอียดการเคลม #{selectedOrder._id.slice(-8).toUpperCase()}
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
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">วันที่เคลม</p>
                        <p className="text-gray-900">
                          {selectedOrder.claimInfo?.claimDate 
                            ? new Date(selectedOrder.claimInfo.claimDate).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Bangkok'
                              })
                            : '-'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">เหตุผลในการเคลม</p>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <p className="text-gray-900">{selectedOrder.claimInfo?.claimReason || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">สถานะการเคลม</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          selectedOrder.claimInfo?.claimStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          selectedOrder.claimInfo?.claimStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {selectedOrder.claimInfo?.claimStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              รอดำเนินการ
                            </span>
                          ) :
                           selectedOrder.claimInfo?.claimStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            ไม่อนุมัติ
                          </span>
                        )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* รูปภาพเคลม */}
                  {selectedOrder.claimInfo?.claimImages && selectedOrder.claimInfo.claimImages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">รูปภาพประกอบการเคลม ({selectedOrder.claimInfo.claimImages.length} รูป)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedOrder.claimInfo.claimImages.map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square group">
                            <Image
                              src={imageUrl}
                              alt={`รูปภาพเคลม ${index + 1}`}
                              fill
                              className="object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(imageUrl)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  คลิกที่รูปเพื่อดูขนาดเต็ม
                </p>
                    </div>
                  )}

                  {/* การตอบกลับที่มีอยู่แล้ว */}
                  {selectedOrder.claimInfo?.adminResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">การตอบกลับของแอดมิน</h3>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-gray-900">{selectedOrder.claimInfo.adminResponse}</p>
                        {selectedOrder.claimInfo.responseDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            ตอบกลับเมื่อ: {new Date(selectedOrder.claimInfo.responseDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Bangkok'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ฟอร์มตอบกลับ */}
                {selectedOrder.claimInfo?.claimStatus === 'pending' && (
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
                )}
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