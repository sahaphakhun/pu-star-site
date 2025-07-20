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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/my-orders');
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error('load my orders error', err);
      } finally {
        setLoading(false);
      }
    };
    if (isLoggedIn) {
      fetchOrders();
    }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">คำสั่งซื้อของฉัน</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">คุณยังไม่มีประวัติการสั่งซื้อ</p>
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
                
                <div className="text-blue-600 font-bold text-lg mb-2">฿{order.totalAmount.toLocaleString()}</div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 line-clamp-1">{order.items.length} รายการ</p>
                  <div className="flex items-center gap-2">
                    {order.taxInvoice?.requestTaxInvoice && (
                      <div className="flex items-center text-xs text-blue-600">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ใบกำกับฯ
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex items-center text-xs text-purple-600">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ติดตาม
                      </div>
                    )}
                    {/* ปุ่มเคลมสินค้า */}
                    {((order.status === 'delivered' || order.status === 'claim_rejected') && !order.claimInfo) && (
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
                    {order.status === 'claim_rejected' && order.claimInfo && (
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
              className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
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

                {/* Status Timeline */}
                {selectedOrder.status && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'claimed' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">สถานะออเดอร์</h3>
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
                              {isCompleted ? '✓' : index + 1}
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

                {/* Tracking Info */}
                {selectedOrder.trackingNumber && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลการจัดส่ง</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">เลขติดตาม</p>
                        <p className="font-medium font-mono">{selectedOrder.trackingNumber}</p>
                      </div>
                      {selectedOrder.shippingProvider && (
                        <div>
                          <p className="text-sm text-gray-600">ขนส่ง</p>
                          <p className="font-medium">{selectedOrder.shippingProvider}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Packing Images */}
                {selectedOrder.packingProofs && selectedOrder.packingProofs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">รูปภาพแพ็คสินค้า</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrder.packingProofs.map((proof, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={proof.url}
                            alt={`รูปแพ็คสินค้า ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(proof.url, '_blank')}
                          />
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {new Date(proof.addedAt).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Info */}
                {selectedOrder.claimInfo && (
                  <div className="bg-pink-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลการเคลม</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">เหตุผล</p>
                        <p className="font-medium">{selectedOrder.claimInfo.claimReason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">สถานะ</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedOrder.claimInfo.claimStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.claimInfo.claimStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.claimInfo.claimStatus === 'pending' ? 'รอดำเนินการ' :
                           selectedOrder.claimInfo.claimStatus === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}
                        </span>
                      </div>
                      {selectedOrder.claimInfo.adminResponse && (
                        <div>
                          <p className="text-sm text-gray-600">การตอบกลับ</p>
                          <p className="font-medium">{selectedOrder.claimInfo.adminResponse}</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'claim_rejected') && !selectedOrder.claimInfo && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      เคลมสินค้า
                    </button>
                  )}
                  {selectedOrder.status === 'claim_rejected' && selectedOrder.claimInfo && (
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