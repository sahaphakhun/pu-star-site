'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionGate } from '@/components/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface QuoteRequestItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [optionName: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

interface QuoteRequest {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: QuoteRequestItem[];
  totalAmount: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  requestDate: string;
  quoteMessage?: string;
  quoteFileUrl?: string;
  quotedBy?: { name: string };
  quotedAt?: string;
  taxInvoice?: {
    requestTaxInvoice: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
}

// Component ที่ใช้ useSearchParams
const QuoteRequestsContent = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseFileUrl, setResponseFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    fetchQuoteRequests();
  }, [isLoggedIn, selectedStatus]);

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quote-requests?status=${selectedStatus}&limit=50`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setQuoteRequests(data.data);
        
        // ถ้ามี highlight ID ให้เลื่อนไปยัง element นั้น
        if (highlightId) {
          setTimeout(() => {
            const element = document.getElementById(`quote-${highlightId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
              }, 3000);
            }
          }, 100);
        }
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลคำขอใบเสนอราคาได้');
      }
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedQuote || !responseMessage.trim()) {
      toast.error('กรุณากรอกข้อความตอบกลับ');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quote-requests/${selectedQuote._id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteMessage: responseMessage.trim(),
          quoteFileUrl: responseFileUrl.trim() || undefined,
        }),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('ตอบกลับคำขอใบเสนอราคาสำเร็จ');
        setShowResponseModal(false);
        setSelectedQuote(null);
        setResponseMessage('');
        setResponseFileUrl('');
        fetchQuoteRequests(); // รีเฟรชข้อมูล
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการตอบกลับ');
      }
    } catch (error) {
      console.error('Error responding to quote request:', error);
      toast.error('เกิดข้อผิดพลาดในการตอบกลับ');
    } finally {
      setSubmitting(false);
    }
  };

  const openResponseModal = (quoteRequest: QuoteRequest) => {
    setSelectedQuote(quoteRequest);
    setResponseMessage('');
    setResponseFileUrl('');
    setShowResponseModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอตอบกลับ';
      case 'quoted':
        return 'ตอบกลับแล้ว';
      case 'approved':
        return 'อนุมัติ';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการคำขอใบเสนอราคา</h1>
        <p className="text-gray-600">ตอบกลับและจัดการคำขอใบเสนอราคาจากลูกค้า</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            กรองตามสถานะ
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอตอบกลับ</option>
            <option value="quoted">ตอบกลับแล้ว</option>
            <option value="approved">อนุมัติ</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>
      </div>

      {/* Quote Requests List */}
      <div className="space-y-6">
        {quoteRequests.length === 0 ? (
          <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีคำขอใบเสนอราคา</h3>
            <p className="text-gray-500">ยังไม่มีลูกค้าขอใบเสนอราคา</p>
          </div>
        ) : (
          quoteRequests.map((quoteRequest) => (
            <motion.div
              key={quoteRequest._id}
              id={`quote-${quoteRequest._id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quoteRequest.customerName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(quoteRequest.status)}`}>
                        {getStatusText(quoteRequest.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {quoteRequest.customerPhone}
                </p>
                      <p className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {quoteRequest.customerAddress}
                </p>
                      <p className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(quoteRequest.requestDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        ฿{quoteRequest.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">ยอดรวม</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">รายการสินค้า</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {quoteRequest.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <span className="text-gray-500 ml-2">
                                ({Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')})
                              </span>
                            )}
                            {item.unitLabel && (
                              <span className="text-gray-500 ml-2">({item.unitLabel})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-600">x{item.quantity}</span>
                            <span className="font-medium">
                              ฿{((item.unitPrice || item.price) * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tax Invoice Info */}
                {quoteRequest.taxInvoice?.requestTaxInvoice && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">ข้อมูลใบกำกับภาษี</h4>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm">
                      <p><strong>บริษัท:</strong> {quoteRequest.taxInvoice.companyName}</p>
                      <p><strong>เลขประจำตัวผู้เสียภาษี:</strong> {quoteRequest.taxInvoice.taxId}</p>
                      {quoteRequest.taxInvoice.companyAddress && (
                        <p><strong>ที่อยู่บริษัท:</strong> {quoteRequest.taxInvoice.companyAddress}</p>
                      )}
                      {quoteRequest.taxInvoice.companyPhone && (
                        <p><strong>เบอร์โทรบริษัท:</strong> {quoteRequest.taxInvoice.companyPhone}</p>
                      )}
                      {quoteRequest.taxInvoice.companyEmail && (
                        <p><strong>อีเมลบริษัท:</strong> {quoteRequest.taxInvoice.companyEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Response Info */}
                {quoteRequest.status === 'quoted' && quoteRequest.quoteMessage && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">การตอบกลับ</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2">{quoteRequest.quoteMessage}</p>
                      {quoteRequest.quoteFileUrl && (
                        <p className="text-sm">
                          <strong>ไฟล์ใบเสนอราคา:</strong>{' '}
                          <a 
                            href={quoteRequest.quoteFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            ดูไฟล์
                          </a>
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        ตอบกลับโดย {quoteRequest.quotedBy?.name} เมื่อ{' '}
                        {quoteRequest.quotedAt && new Date(quoteRequest.quotedAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  {quoteRequest.status === 'pending' && (
                    <button
                      onClick={() => openResponseModal(quoteRequest)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      ตอบกลับ
                    </button>
                  )}
                  {quoteRequest.status === 'quoted' && (
                    <button
                      onClick={() => openResponseModal(quoteRequest)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      แก้ไขการตอบกลับ
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedQuote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResponseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">ตอบกลับคำขอใบเสนอราคา</h3>
                  <button onClick={() => setShowResponseModal(false)} className="p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Customer Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>ชื่อ:</strong> {selectedQuote.customerName}</p>
                    <p><strong>เบอร์โทร:</strong> {selectedQuote.customerPhone}</p>
                    <p><strong>ที่อยู่:</strong> {selectedQuote.customerAddress}</p>
                    <p><strong>ยอดรวม:</strong> ฿{selectedQuote.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ข้อความตอบกลับ *
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="เช่น เรียนคุณลูกค้า ทางเราได้ประเมินราคาแล้ว กรุณาดูไฟล์ใบเสนอราคาที่แนบมาด้วย หากสนใจกรุณาติดต่อกลับมา"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ลิงก์ไฟล์ใบเสนอราคา
                    </label>
                    <input
                      type="url"
                      value={responseFileUrl}
                      onChange={(e) => setResponseFileUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder="https://www.winrichdynamic.com/quote.pdf"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ไม่บังคับ - สามารถแนบลิงก์ไฟล์ PDF หรือเอกสารใบเสนอราคา
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleResponseSubmit}
                    disabled={submitting || !responseMessage.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'กำลังส่ง...' : 'ส่งการตอบกลับ'}
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

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-lg text-gray-600">กำลังโหลดหน้า...</p>
    </div>
  </div>
);

// Main component with Suspense wrapper
const QuoteRequestsPage = () => {
  return (
    <PermissionGate permission={PERMISSIONS.ORDERS_VIEW}>
      <Suspense fallback={<LoadingFallback />}>
        <QuoteRequestsContent />
      </Suspense>
    </PermissionGate>
  );
};

export default QuoteRequestsPage; 