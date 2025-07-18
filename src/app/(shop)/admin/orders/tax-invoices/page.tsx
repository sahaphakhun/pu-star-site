'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

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
  companyName: string;
  taxId: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
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
  status: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'claimed';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  taxInvoice?: TaxInvoice;
}

const TaxInvoicesPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        // กรองเฉพาะออเดอร์ที่ขอใบกำกับภาษี
        const taxInvoiceOrders = data.filter((order: Order) => 
          order.taxInvoice?.requestTaxInvoice === true
        );
        setOrders(taxInvoiceOrders);
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.taxInvoice?.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.taxInvoice?.taxId.includes(searchTerm);
    
    const dateObj = new Date(order.createdAt);
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

  const totalTaxInvoiceValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ขอใบกำกับภาษี</h1>
          <p className="text-gray-600">ออเดอร์ที่ลูกค้าขอใบกำกับภาษี</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
            <div className="text-sm text-gray-600">ออเดอร์ขอใบกำกับฯ</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">฿{totalTaxInvoiceValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">มูลค่ารวมใบกำกับฯ</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{filteredOrders.length > 0 ? Math.round(totalTaxInvoiceValue / filteredOrders.length) : 0}</div>
            <div className="text-sm text-gray-600">มูลค่าเฉลี่ยต่อใบ</div>
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
                placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, ชื่อบริษัท, หรือเลขประจำตัวผู้เสียภาษี"
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

        {/* Orders Table */}
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
                    บริษัท/เลขประจำตัวผู้เสียภาษี
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สั่งซื้อ
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
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          📄 ใบกำกับฯ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.taxInvoice?.companyName}</div>
                        <div className="text-sm text-gray-500">{order.taxInvoice?.taxId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
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
                        ดูรายละเอียด
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบคำขอใบกำกับภาษี</h3>
              <p className="text-gray-600">ไม่มีออเดอร์ที่ขอใบกำกับภาษีในช่วงเวลาที่เลือก</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  ใบกำกับภาษี #{selectedOrder._id.slice(-8).toUpperCase()}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold text-orange-800">ลูกค้าขอใบกำกับภาษี</span>
                  </div>
                  <div className="mt-2 text-sm text-orange-700">
                    สถานะออเดอร์: {statusLabels[selectedOrder.status]}
                  </div>
                </div>
              </div>

              {/* Tax Invoice Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลใบกำกับภาษี</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>ชื่อบริษัท/นิติบุคคล:</strong></p>
                      <p className="text-blue-800">{selectedOrder.taxInvoice?.companyName}</p>
                    </div>
                    <div>
                      <p><strong>เลขประจำตัวผู้เสียภาษี:</strong></p>
                      <p className="text-blue-800">{selectedOrder.taxInvoice?.taxId}</p>
                    </div>
                    {selectedOrder.taxInvoice?.companyAddress && (
                      <div className="md:col-span-2">
                        <p><strong>ที่อยู่บริษัท:</strong></p>
                        <p className="text-blue-800">{selectedOrder.taxInvoice.companyAddress}</p>
                      </div>
                    )}
                    {selectedOrder.taxInvoice?.companyPhone && (
                      <div>
                        <p><strong>เบอร์โทรบริษัท:</strong></p>
                        <p className="text-blue-800">{selectedOrder.taxInvoice.companyPhone}</p>
                      </div>
                    )}
                    {selectedOrder.taxInvoice?.companyEmail && (
                      <div>
                        <p><strong>อีเมลบริษัท:</strong></p>
                        <p className="text-blue-800">{selectedOrder.taxInvoice.companyEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>ชื่อ:</strong> {selectedOrder.customerName}</p>
                  <p><strong>เบอร์โทร:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>ที่อยู่จัดส่ง:</strong> {selectedOrder.customerAddress}</p>
                  <p><strong>การชำระเงิน:</strong> {selectedOrder.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}</p>
                  {selectedOrder.trackingNumber && (
                    <p><strong>เลขพัสดุ:</strong> {selectedOrder.trackingNumber} ({selectedOrder.shippingProvider})</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">จำนวน: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">฿{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>ยอดรวม (รวม VAT 7%):</span>
                    <span className="font-bold text-lg">฿{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                    <span>ยอดก่อน VAT:</span>
                    <span>฿{Math.round(selectedOrder.totalAmount / 1.07).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>VAT 7%:</span>
                    <span>฿{Math.round(selectedOrder.totalAmount - (selectedOrder.totalAmount / 1.07)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

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
        </div>
      )}
    </div>
  );
};

export default TaxInvoicesPage; 