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
  status?: string;
  taxInvoice?: TaxInvoice;
}

const MyOrdersPage = () => {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
                <div className="text-blue-600 font-bold text-lg mb-2">฿{order.totalAmount.toLocaleString()}</div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 line-clamp-1">{order.items.length} รายการ</p>
                  {order.taxInvoice?.requestTaxInvoice && (
                    <div className="flex items-center text-xs text-blue-600">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ใบกำกับฯ
                    </div>
                  )}
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
                        <p className="text-sm text-gray-600">ชื่อบริษัท</p>
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrdersPage; 