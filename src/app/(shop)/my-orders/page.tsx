'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
}

interface TaxInvoice {
  requestTaxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface Order {
  _id: string;
  customerName: string;
  totalAmount: number;
  orderDate: string;
  items: OrderItem[];
  paymentMethod?: 'cod' | 'transfer';
  status?: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'claimed' | 'claim_approved' | 'claim_rejected';
  taxInvoice?: TaxInvoice;
  trackingNumber?: string;
  shippingProvider?: string;
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: string;
  }>;
  claimInfo?: {
    claimDate: string;
    claimReason: string;
    claimImages: string[];
    claimStatus: 'pending' | 'approved' | 'rejected';
    adminResponse?: string;
    responseDate?: string;
  };
  updatedAt?: string; // Added for enhanced order status
  slipUrl?: string; // Added for slip verification
  slipVerification?: {
    verified: boolean;
    confidence: number;
    verifiedAt?: string;
    error?: string;
    slip2GoData?: {
      bank: string;
      amount: number;
      date: string;
      time: string;
    };
  };
}

const MyOrdersPage = () => {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({
    reason: '',
    images: [] as File[]
  });
  const [uploadingClaim, setUploadingClaim] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    packing: 'ที่ต้องได้รับ',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
    claim_approved: 'เคลมสำเร็จ',
    claim_rejected: 'เคลมถูกปฏิเสธ'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packing: 'bg-orange-100 text-orange-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    claimed: 'bg-pink-100 text-pink-800',
    claim_approved: 'bg-teal-100 text-teal-800',
    claim_rejected: 'bg-indigo-100 text-indigo-800'
  };

  const getStatusProgress = (status: string) => {
    const statusOrder = ['pending', 'confirmed', 'packing', 'shipped', 'delivered'];
    return statusOrder.indexOf(status) + 1;
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?returnUrl=/my-orders');
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchOrders = async () => {
    try {
      // เพิ่ม cache busting parameter เพื่อให้ได้ข้อมูลล่าสุด
      const res = await fetch(`/api/orders/my-orders?_t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        setLastUpdateTime(new Date());
        
        // Debug: แสดงข้อมูล orders ที่ส่งสำเร็จ
        const deliveredOrders = data.filter(order => order.status === 'delivered');
        console.log('Orders ที่ส่งสำเร็จ:', deliveredOrders.map(order => ({
          id: order._id.slice(-8),
          status: order.status,
          claimInfo: order.claimInfo,
          hasClaimDate: !!order.claimInfo?.claimDate,
          shouldShowButton: !order.claimInfo || !order.claimInfo.claimDate
        })));
      }
    } catch (err) {
      console.error('load my orders error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  // เพิ่ม focus listener เพื่อ refresh ข้อมูลเมื่อกลับมาที่หน้า
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn) {
        fetchOrders();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn]);

  // Auto-refresh ทุก 30 วินาทีเมื่ออยู่ในหน้านี้
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      // Auto-refresh แบบเงียบ ๆ (ไม่แสดง loading)
      fetch(`/api/orders/my-orders?_t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data);
            setLastUpdateTime(new Date());
          }
        })
        .catch(err => {
          console.error('Auto-refresh error:', err);
        });
    }, 30000); // 30 วินาที

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleClaim = async () => {
    if (!selectedOrder || !claimData.reason.trim()) {
      alert('กรุณาระบุเหตุผลในการเคลม');
      return;
    }

    setUploadingClaim(true);
    try {
      // อัพโหลดรูปภาพไป Cloudinary ก่อน (ถ้ามี)
      const uploadedImageUrls: string[] = [];
      
      if (claimData.images.length > 0) {
        const uploadPromises = claimData.images.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
          formData.append('folder', 'claim-images');
          formData.append('public_id', `claim-${selectedOrder._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error(`การอัพโหลดรูปภาพล้มเหลว: ${response.status}`);
          }

          const data = await response.json();
          return data.secure_url;
        });

        const urls = await Promise.all(uploadPromises);
        uploadedImageUrls.push(...urls);
      }

      // ส่งข้อมูลเคลมไป API
      const formData = new FormData();
      formData.append('reason', claimData.reason);
      
      // ส่ง URL ของรูปที่อัพโหลดแล้ว
      uploadedImageUrls.forEach((url, index) => {
        formData.append(`imageUrl_${index}`, url);
      });

      const response = await fetch(`/api/orders/${selectedOrder._id}/claim`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => 
          order._id === selectedOrder._id ? updatedOrder : order
        ));
        setSelectedOrder(updatedOrder);
        setShowClaimModal(false);
        setClaimData({ reason: '', images: [] });
        alert('ส่งคำขอเคลมสำเร็จ');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'เกิดข้อผิดพลาดในการเคลม');
      }
    } catch (error) {
      console.error('Error claiming order:', error);
      alert('เกิดข้อผิดพลาดในการเคลม: ' + (error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'));
    } finally {
      setUploadingClaim(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <svg className="w-8 h-8 sm:w-9 sm:h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          คำสั่งซื้อของฉัน
        </h1>
            {orders.length > 0 && (
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                ทั้งหมด {orders.length} รายการ
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:items-end space-y-2">
            {lastUpdateTime && (
              <div className="text-xs text-gray-500">
                🕐 อัพเดตล่าสุด: {lastUpdateTime.toLocaleTimeString('th-TH')}
              </div>
            )}
            <button
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-3 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-xl sm:rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base sm:text-sm"
            >
              <svg className={`w-5 h-5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="flex items-center gap-1">
            {loading ? 'กำลังโหลด...' : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                รีเฟรช
              </>
            )}
          </span>
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center mx-4 sm:mx-0">
          <div className="text-gray-400 mb-6">
          <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">ยังไม่มีประวัติการสั่งซื้อ</h2>
          <p className="text-base sm:text-lg text-gray-500 mb-8 leading-relaxed">
            เริ่มต้นการช้อปปิ้งและสั่งซื้อสินค้า<br className="sm:hidden" />
            เพื่อดูประวัติคำสั่งซื้อของคุณที่นี่
          </p>
          <a
            href="/shop"
            className="inline-block bg-blue-600 text-white px-8 py-4 sm:px-6 sm:py-3 rounded-xl font-semibold text-lg sm:text-base hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          เริ่มช้อปปิ้ง
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString('th-TH')}</span>
                </div>
                
                {/* Status Progress Bar */}
                {order.status && order.status !== 'cancelled' && order.status !== 'claimed' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>ความคืบหน้า</span>
                      <span>{getStatusProgress(order.status)}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(getStatusProgress(order.status) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                {order.status && (
                  <div className="mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                )}

                {/* Enhanced Tracking and Shipping Info */}
                {(order.trackingNumber || order.shippingProvider) && (
                  <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center text-purple-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span className="font-medium text-xs">ข้อมูลการจัดส่ง</span>
                    </div>
                    {order.shippingProvider && (
                      <div className="text-xs text-purple-600 mb-1">
                        <span className="font-medium">ขนส่ง:</span> {order.shippingProvider}
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="text-xs text-purple-600">
                        <span className="font-medium">เลขแทรค:</span> {order.trackingNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* Packing Images Preview */}
                {order.packingProofs && order.packingProofs.length > 0 && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-700">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-xs">รูปแพ็คสินค้า</span>
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {order.packingProofs.length} รูป
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="text-blue-600 font-bold text-lg mb-2">฿{order.totalAmount.toLocaleString()}</div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 line-clamp-1">{order.items.length} รายการ</p>
                  <div className="flex items-center gap-2">
                    {order.taxInvoice?.requestTaxInvoice && (
                      <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ใบกำกับฯ
                      </div>
                    )}
                    
                    {/* ปุ่มเคลมสินค้า */}
                    {order.status === 'delivered' && (!order.claimInfo || !order.claimInfo.claimDate) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowClaimModal(true);
                        }}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 transition-colors"
                      >
                        เคลม
                      </button>
                    )}
                    
                    {order.status === 'claim_rejected' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowClaimModal(true);
                        }}
                        className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md hover:bg-orange-200 transition-colors"
                      >
                        เคลมใหม่
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">คำสั่งซื้อ #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Enhanced Order Status */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    สถานะออเดอร์
                  </h3>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-full ${statusColors[selectedOrder.status!]}`}>
                      {statusLabels[selectedOrder.status!]}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">
                      อัพเดตล่าสุด: {new Date(selectedOrder.updatedAt || selectedOrder.orderDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Bangkok'
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Timeline */}
                {selectedOrder.status && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'claimed' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">ความคืบหน้า</h3>
                    <div className="flex items-center justify-between">
                      {['pending', 'confirmed', 'packing', 'shipped', 'delivered'].map((status, index) => {
                        const isCompleted = getStatusProgress(selectedOrder.status!) > index;
                        const isCurrent = getStatusProgress(selectedOrder.status!) === index + 1;
                        
                        return (
                          <div key={status} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                              isCompleted ? 'bg-green-500 text-white' :
                               isCurrent ? 'bg-blue-500 text-white' :
                               'bg-gray-300 text-gray-600'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : index + 1}
                            </div>
                            <span className={`text-xs text-center ${
                              isCompleted || isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'
                            }`}>
                              {statusLabels[status as keyof typeof statusLabels]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enhanced Tracking Info */}
                {(selectedOrder.trackingNumber || selectedOrder.shippingProvider) && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      ข้อมูลการจัดส่ง
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.shippingProvider && (
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                          <p className="text-sm text-gray-600 mb-1">บริษัทขนส่ง</p>
                          <p className="font-bold text-purple-700 text-lg">{selectedOrder.shippingProvider}</p>
                        </div>
                      )}
                      {selectedOrder.trackingNumber && (
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                          <p className="text-sm text-gray-600 mb-1">เลขติดตาม</p>
                          <p className="font-bold text-purple-700 text-lg font-mono">{selectedOrder.trackingNumber}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedOrder.trackingNumber!)}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            คัดลอก
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Packing Images */}
                {selectedOrder.packingProofs && selectedOrder.packingProofs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      รูปภาพการแพ็คสินค้า
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {selectedOrder.packingProofs.length} รูป
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedOrder.packingProofs.map((proof, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={proof.url}
                            alt={`รูปแพ็คสินค้า ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => window.open(proof.url, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {new Date(proof.addedAt).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      คลิกที่รูปเพื่อดูขนาดเต็ม
                    </p>
                  </div>
                )}

                {/* Claim Info - แสดงเฉพาะเมื่อมีการเคลมและได้รับการอนุมัติหรือปฏิเสธแล้ว */}
                {selectedOrder.claimInfo && (selectedOrder.claimInfo.claimStatus === 'approved' || selectedOrder.claimInfo.claimStatus === 'rejected' || selectedOrder.status === 'claim_approved' || selectedOrder.status === 'claim_rejected') && (
                  <div className={`p-4 rounded-lg mb-6 border ${
                    selectedOrder.status === 'claim_approved' ? 'bg-green-50 border-green-200' :
                    selectedOrder.status === 'claim_rejected' ? 'bg-red-50 border-red-200' : 
                    'bg-pink-50 border-pink-200'
                  }`}>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className={`w-5 h-5 mr-2 ${
                        selectedOrder.status === 'claim_approved' ? 'text-green-600' :
                        selectedOrder.status === 'claim_rejected' ? 'text-red-600' : 
                        'text-pink-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      ข้อมูลการเคลม
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.claimInfo?.claimDate && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">วันที่เคลม</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedOrder.claimInfo.claimDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Bangkok'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedOrder.claimInfo?.claimReason && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">เหตุผลในการเคลม</p>
                          <div className="bg-white p-3 rounded border border-pink-200">
                            <p className="text-gray-900">{selectedOrder.claimInfo.claimReason}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">สถานะการเคลม</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          (selectedOrder.claimInfo?.claimStatus === 'pending' || selectedOrder.status === 'claimed') ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          (selectedOrder.claimInfo?.claimStatus === 'approved' || selectedOrder.status === 'claim_approved') ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {(selectedOrder.claimInfo?.claimStatus === 'pending' || selectedOrder.status === 'claimed') ? (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              รอดำเนินการ
                            </span>
                          ) :
                           (selectedOrder.claimInfo?.claimStatus === 'approved' || selectedOrder.status === 'claim_approved') ? (
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
                      
                      {/* รูปภาพการเคลมที่ลูกค้าส่งไป */}
                      {selectedOrder.claimInfo?.claimImages && selectedOrder.claimInfo.claimImages.length > 0 && (
                        <div>
                                                      <p className="text-sm text-gray-600 mb-2">รูปภาพประกอบการเคลม ({selectedOrder.claimInfo?.claimImages?.length || 0} รูป)</p>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedOrder.claimInfo.claimImages.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <Image
                                  src={imageUrl}
                                  alt={`รูปประกอบการเคลม ${index + 1}`}
                                  width={150}
                                  height={150}
                                  className="w-full h-32 object-cover rounded-lg border border-pink-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
                      
                      {/* การตอบกลับจากแอดมิน */}
                      {selectedOrder.claimInfo?.adminResponse && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">การตอบกลับจากแอดมิน</p>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-gray-900">{selectedOrder.claimInfo.adminResponse}</p>
                            {selectedOrder.claimInfo?.responseDate && (
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
                  </div>
                )}

                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}{item.unitLabel ? ` (${item.unitLabel})` : ''}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">฿{item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax Invoice Info */}
                {selectedOrder.taxInvoice?.requestTaxInvoice && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ขอใบกำกับภาษี
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">นิติบุคคล/บุคคลธรรมดา</p>
                        <p className="font-medium">{selectedOrder.taxInvoice.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี</p>
                        <p className="font-medium font-mono">{selectedOrder.taxInvoice.taxId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slip Information */}
                {selectedOrder.slipUrl && (
                  <div className="bg-green-50 p-4 rounded-lg mt-6 border border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      หลักฐานการโอนเงิน
                    </h3>
                    
                    {/* Slip Image */}
                    <div className="mb-4">
                      <img
                        src={selectedOrder.slipUrl}
                        alt="หลักฐานการโอนเงิน"
                        className="w-full max-w-md h-auto rounded-lg border border-green-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        คลิกที่รูปเพื่อดูขนาดเต็ม
                      </p>
                    </div>

                    {/* Slip Verification Status */}
                    {selectedOrder.slipVerification ? (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            selectedOrder.slipVerification.verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedOrder.slipVerification.verified ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                ตรวจสอบแล้ว
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ตรวจสอบไม่สำเร็จ
                              </>
                            )}
                          </span>
                          {selectedOrder.slipVerification.confidence > 0 && (
                            <span className="text-xs text-gray-600">
                              ความแม่นยำ: {selectedOrder.slipVerification.confidence}%
                            </span>
                          )}
                        </div>
                        {selectedOrder.slipVerification.verifiedAt && (
                          <p className="text-xs text-gray-600">
                            ตรวจสอบเมื่อ: {new Date(selectedOrder.slipVerification.verifiedAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Bangkok'
                            })}
                          </p>
                        )}
                        {selectedOrder.slipVerification.error && (
                          <p className="text-xs text-red-600 mt-1">
                            ข้อผิดพลาด: {selectedOrder.slipVerification.error}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          รอการตรวจสอบ
                        </span>
                      </div>
                    )}

                    {/* Slip Details */}
                    {selectedOrder.slipVerification?.slip2GoData && (
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">รายละเอียดสลิป</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">ธนาคาร:</span>
                            <span className="ml-1 font-medium">{selectedOrder.slipVerification.slip2GoData.bank || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">จำนวนเงิน:</span>
                            <span className="ml-1 font-medium">฿{selectedOrder.slipVerification.slip2GoData.amount?.toLocaleString() || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">วันที่:</span>
                            <span className="ml-1 font-medium">{selectedOrder.slipVerification.slip2GoData.date ? new Date(selectedOrder.slipVerification.slip2GoData.date).toLocaleDateString('th-TH') : '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">เวลา:</span>
                            <span className="ml-1 font-medium">{selectedOrder.slipVerification.slip2GoData.time || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold">ยอดรวม</span>
                  <span className="text-xl font-bold text-blue-600">฿{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ปิด
                  </button>
                  {selectedOrder.status === 'delivered' && (!selectedOrder.claimInfo || !selectedOrder.claimInfo.claimDate) && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      เคลมสินค้า
                    </button>
                  )}
                  {selectedOrder.status === 'claim_rejected' && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      เคลมใหม่อีกครั้ง
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowClaimModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">เคลมสินค้า</h2>
                  <button onClick={() => setShowClaimModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลในการเคลม <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={claimData.reason}
                      onChange={(e) => setClaimData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="กรุณาระบุเหตุผลในการเคลมสินค้า..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รูปภาพประกอบ (ถ้ามี)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            alert('สามารถอัพโหลดได้สูงสุด 5 รูป');
                            return;
                          }
                          setClaimData(prev => ({ ...prev, images: files }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    {claimData.images.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">เลือกแล้ว {claimData.images.length} ไฟล์</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {claimData.images.map((file, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                              {file.name}
                              <button
                                onClick={() => setClaimData(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index)
                                }))}
                                className="ml-1 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowClaimModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={!claimData.reason.trim() || uploadingClaim}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadingClaim ? 'กำลังส่ง...' : 'ส่งคำขอเคลม'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrdersPage;