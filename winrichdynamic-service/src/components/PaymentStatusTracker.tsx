'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { IOrder } from '@/models/Order';

interface PaymentStatusTrackerProps {
  order: IOrder;
  onUpdate?: (updatedOrder: IOrder) => void;
  isAdmin?: boolean;
}

export default function PaymentStatusTracker({ 
  order, 
  onUpdate, 
  isAdmin = false 
}: PaymentStatusTrackerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'collected':
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusText = (paymentMethod: string, status: string) => {
    if (paymentMethod === 'cod') {
      switch (status) {
        case 'pending':
          return 'รอการชำระเงิน';
        case 'collected':
          return 'ชำระเงินแล้ว';
        case 'failed':
          return 'ชำระเงินล้มเหลว';
        default:
          return 'ไม่ทราบสถานะ';
      }
    } else if (paymentMethod === 'transfer') {
      switch (status) {
        case 'pending_verification':
          return 'รอการตรวจสอบสลิป';
        case 'verified':
          return 'ยืนยันสลิปแล้ว';
        case 'rejected':
          return 'สลิปไม่ถูกต้อง';
        default:
          return 'รออัพโหลดสลิป';
      }
    } else if (paymentMethod === 'credit') {
      return 'เครดิต';
    }
    return 'ไม่ทราบสถานะ';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // จำลองการอัพโหลดไฟล์ (ในระบบจริงควรใช้ Cloudinary หรือบริการอัพโหลดไฟล์)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', (order._id as any).toString());

      // จำลอง progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`/api/orders/${(order._id as any).toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload_slip',
          slipUrl: URL.createObjectURL(file) // ในระบบจริงควรเป็น URL จากบริการอัพโหลด
        }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const updatedOrder = await response.json();
        if (onUpdate) {
          onUpdate(updatedOrder);
        }
      } else {
        throw new Error('อัพโหลดสลิปไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading slip:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดสลิป กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaymentAction = async (action: string) => {
    try {
      const response = await fetch(`/api/orders/${(order._id as any).toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          verifiedBy: 'admin', // ในระบบจริงควรมาจาก authentication
        }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        if (onUpdate) {
          onUpdate(updatedOrder);
        }
      } else {
        throw new Error('ดำเนินการไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error handling payment action:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  const renderCODSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">การชำระเงินปลายทาง (COD)</h4>
          <p className="text-sm text-gray-600">ชำระเงินเมื่อได้รับสินค้า</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(order.codPaymentStatus || 'pending')}`}>
          {getPaymentStatusText('cod', order.codPaymentStatus || 'pending')}
        </div>
      </div>

      {order.codPaymentDueDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">
              กำหนดชำระเงิน: {new Date(order.codPaymentDueDate).toLocaleDateString('th-TH')}
            </span>
          </div>
        </div>
      )}

      {order.codReminderSent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">ส่งการแจ้งเตือนแล้ว</span>
          </div>
        </div>
      )}

      {isAdmin && order.status === 'delivered' && order.codPaymentStatus !== 'collected' && (
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePaymentAction('confirm_cod_payment')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ยืนยันการชำระเงิน
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePaymentAction('fail_cod_payment')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ชำระเงินล้มเหลว
          </motion.button>
        </div>
      )}
    </div>
  );

  const renderTransferSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">โอนเงินผ่านธนาคาร</h4>
          <p className="text-sm text-gray-600">โอนเงินก่อนจัดส่งสินค้า</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(order.slipVerification?.status || 'pending')}`}>
          {getPaymentStatusText('transfer', order.slipVerification?.status || 'pending')}
        </div>
      </div>

      {!order.slipVerification?.slipUrl && !isAdmin && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="mt-4">
            <label htmlFor="slip-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                คลิกเพื่ออัพโหลดสลิปการโอนเงิน
              </span>
              <input
                id="slip-upload"
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF สูงสุด 10MB</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">กำลังอัพโหลด...</span>
            <span className="text-sm text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {order.slipVerification?.slipUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-900">อัพโหลดสลิปแล้ว</span>
            </div>
            {order.slipVerification?.slipUploadedAt && (
              <span className="text-xs text-green-700">
                {new Date(order.slipVerification.slipUploadedAt).toLocaleDateString('th-TH')}
              </span>
            )}
          </div>
          {order.slipVerification?.slipUrl && (
            <div className="mt-2">
              <a
                href={order.slipVerification.slipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                ดูสลิป
              </a>
            </div>
          )}
        </div>
      )}

      {isAdmin && order.slipVerification?.slipUrl && !order.slipVerification?.verified && (
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePaymentAction('verify_slip')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ยืนยันสลิป
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePaymentAction('reject_slip')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ปฏิเสธสลิป
          </motion.button>
        </div>
      )}
    </div>
  );

  const renderCreditSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">การชำระเงินแบบเครดิต</h4>
          <p className="text-sm text-gray-600">ชำระเงินตามรอบบิล</p>
        </div>
        <div className="px-3 py-1 rounded-full text-sm font-medium border bg-purple-100 text-purple-800 border-purple-200">
          เครดิต
        </div>
      </div>

      {order.creditPaymentDueDate && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center text-purple-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">
              ครบกำหนด: {new Date(order.creditPaymentDueDate).toLocaleDateString('th-TH')}
            </span>
          </div>
        </div>
      )}

      {order.creditReminderSent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">ส่งการแจ้งเตือนแล้ว</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">สถานะการชำระเงิน</h3>
      </div>

      <div className="space-y-6">
        {order.paymentMethod === 'cod' && renderCODSection()}
        {order.paymentMethod === 'transfer' && renderTransferSection()}
        {order.paymentMethod === 'credit' && renderCreditSection()}

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ยอดรวม:</span>
            <span className="text-lg font-bold text-gray-900">฿{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}