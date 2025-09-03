'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AIOrderItem {
  sku: string | null;
  name: string;
  qty: number;
  variant: {
    color: string | null;
    size: string | null;
  };
  note: string | null;
}

interface AIOrderPricing {
  currency: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
}

interface AIOrderCustomer {
  name: string | null;
  phone: string | null;
  address: string | null;
}

interface AIOrder {
  _id: string;
  psid: string;
  order_status: string;
  items: AIOrderItem[];
  pricing: AIOrderPricing;
  customer: AIOrderCustomer;
  errorMessages: string[];
  aiResponse: string;
  userMessage: string;
  mappedOrderId?: string;
  mappedAt?: string;
  mappedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AIOrdersPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [aiOrders, setAiOrders] = useState<AIOrder[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState('7'); // 7, 30, 90 days
  const [syncResults, setSyncResults] = useState<{
    total: number;
    new: number;
    updated: number;
    errors: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredOrders, setFilteredOrders] = useState<AIOrder[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !user) {
      redirect('/login');
      return;
    }
    
    fetchAIOrders();
    fetchOrders();
  }, [authLoading, isLoggedIn, user]);

  // Filter orders based on status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(aiOrders);
    } else {
      setFilteredOrders(aiOrders.filter(order => order.order_status === statusFilter));
    }
  }, [aiOrders, statusFilter]);

  const fetchAIOrders = async () => {
    try {
      const response = await fetch('/api/ai-orders');
      const data = await response.json();
      if (data.success) {
        setAiOrders(data.data.orders);
        setFilteredOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching AI orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapOrder = async (aiOrderId: string, orderId: string) => {
    setSaving(prev => ({ ...prev, [aiOrderId]: true }));
    
    try {
      const response = await fetch('/api/ai-orders/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiOrderId,
          orderId,
          mappedBy: user?.name || 'Admin'
        }),
      });

      const data = await response.json();
      if (data.success) {
        // อัปเดตสถานะใน UI
        setAiOrders(prev => prev.map(order => 
          order._id === aiOrderId 
            ? { ...order, mappedOrderId: orderId, mappedAt: new Date().toISOString(), mappedBy: user?.name || 'Admin' }
            : order
        ));
        setMapping(prev => ({ ...prev, [aiOrderId]: '' }));
      } else {
        alert('เกิดข้อผิดพลาดในการแมพ: ' + data.error);
      }
    } catch (error) {
      console.error('Error mapping order:', error);
      alert('เกิดข้อผิดพลาดในการแมพ');
    } finally {
      setSaving(prev => ({ ...prev, [aiOrderId]: false }));
    }
  };

  const handleUnmapOrder = async (aiOrderId: string) => {
    setSaving(prev => ({ ...prev, [aiOrderId]: true }));
    
    try {
      const response = await fetch(`/api/ai-orders/map?aiOrderId=${aiOrderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // อัปเดตสถานะใน UI
        setAiOrders(prev => prev.map(order => 
          order._id === aiOrderId 
            ? { ...order, mappedOrderId: undefined, mappedAt: undefined, mappedBy: undefined }
            : order
        ));
      } else {
        alert('เกิดข้อผิดพลาดในการยกเลิกแมพ: ' + data.error);
      }
    } catch (error) {
      console.error('Error unmapping order:', error);
      alert('เกิดข้อผิดพลาดในการยกเลิกแมพ');
    } finally {
      setSaving(prev => ({ ...prev, [aiOrderId]: false }));
    }
  };

  const handleSyncConversations = async () => {
    setSyncing(true);
    setSyncResults(null);
    
    try {
      const response = await fetch('/api/ai-orders/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: parseInt(syncDateRange),
          adminName: user?.name || 'Admin'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSyncResults(data.data);
        // รีเฟรชรายการ AI Orders
        await fetchAIOrders();
        alert(`ซิงค์สำเร็จ!\n\nรวม: ${data.data.total} รายการ\nใหม่: ${data.data.new} รายการ\nอัปเดต: ${data.data.updated} รายการ\nข้อผิดพลาด: ${data.data.errors} รายการ`);
      } else {
        alert('เกิดข้อผิดพลาดในการซิงค์: ' + data.error);
      }
    } catch (error) {
      console.error('Error syncing conversations:', error);
      alert('เกิดข้อผิดพลาดในการซิงค์');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending_confirmation': return 'bg-yellow-100 text-yellow-800';
      case 'collecting_info': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading if not logged in (will redirect)
  if (!isLoggedIn || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Orders Management</h1>
        <p className="text-gray-600">จัดการการแมพสินค้าจาก AI Orders กับ Orders จริง</p>
      </div>

      {/* Sync Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 ซิงค์ข้อมูลจากประวัติการสนทนา</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ระยะเวลาที่ต้องการซิงค์
            </label>
            <select
              value={syncDateRange}
              onChange={(e) => setSyncDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 วันล่าสุด</option>
              <option value="30">30 วันล่าสุด</option>
              <option value="90">90 วันล่าสุด</option>
            </select>
          </div>
          <button
            onClick={handleSyncConversations}
            disabled={syncing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังซิงค์...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ซิงค์ข้อมูล
              </>
            )}
          </button>
        </div>
        
        {syncResults && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">ผลการซิงค์:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">รวม:</span> {syncResults.total} รายการ
              </div>
              <div>
                <span className="font-medium text-green-700">ใหม่:</span> {syncResults.new} รายการ
              </div>
              <div>
                <span className="font-medium text-green-700">อัปเดต:</span> {syncResults.updated} รายการ
              </div>
              <div>
                <span className="font-medium text-red-700">ข้อผิดพลาด:</span> {syncResults.errors} รายการ
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 กรองข้อมูล</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะออเดอร์
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด ({aiOrders.length})</option>
              <option value="draft">ร่าง ({aiOrders.filter(o => o.order_status === 'draft').length})</option>
              <option value="collecting_info">รวบรวมข้อมูล ({aiOrders.filter(o => o.order_status === 'collecting_info').length})</option>
              <option value="pending_confirmation">รอยืนยัน ({aiOrders.filter(o => o.order_status === 'pending_confirmation').length})</option>
              <option value="completed">เสร็จสิ้น ({aiOrders.filter(o => o.order_status === 'completed').length})</option>
              <option value="canceled">ยกเลิก ({aiOrders.filter(o => o.order_status === 'canceled').length})</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            แสดง {filteredOrders.length} รายการจากทั้งหมด {aiOrders.length} รายการ
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        {filteredOrders.map((aiOrder) => (
          <div key={aiOrder._id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Order #{aiOrder._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500">PSID: {aiOrder.psid}</p>
                <p className="text-sm text-gray-500">สร้างเมื่อ: {formatDate(aiOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(aiOrder.order_status)}`}>
                  {aiOrder.order_status}
                </span>
                {aiOrder.mappedOrderId && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    แมพแล้ว
                  </span>
                )}
              </div>
            </div>

            {/* ข้อมูลลูกค้า */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">ชื่อ:</span> {aiOrder.customer.name || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">โทรศัพท์:</span> {aiOrder.customer.phone || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">ที่อยู่:</span> {aiOrder.customer.address || 'ไม่ระบุ'}
                </div>
              </div>
            </div>

            {/* รายการสินค้า */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">รายการสินค้า</h4>
              <div className="space-y-2">
                {aiOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        จำนวน: {item.qty}
                        {item.variant.color && ` | สี: ${item.variant.color}`}
                        {item.variant.size && ` | ขนาด: ${item.variant.size}`}
                        {item.note && ` | หมายเหตุ: ${item.note}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.sku || 'ไม่มี SKU'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ราคา */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ราคา</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">ยอดสินค้า:</span> {aiOrder.pricing.subtotal.toLocaleString()} บาท
                </div>
                <div>
                  <span className="font-medium">ส่วนลด:</span> {aiOrder.pricing.discount.toLocaleString()} บาท
                </div>
                <div>
                  <span className="font-medium">ค่าจัดส่ง:</span> {aiOrder.pricing.shipping_fee.toLocaleString()} บาท
                </div>
                <div>
                  <span className="font-medium">รวมทั้งหมด:</span> {aiOrder.pricing.total.toLocaleString()} บาท
                </div>
              </div>
            </div>

            {/* ข้อความจากผู้ใช้และ AI */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ข้อความ</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="font-medium text-blue-900">ผู้ใช้:</div>
                  <div className="text-sm text-blue-800">{aiOrder.userMessage}</div>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <div className="font-medium text-green-900">AI:</div>
                  <div className="text-sm text-green-800 whitespace-pre-wrap">{aiOrder.aiResponse}</div>
                </div>
              </div>
            </div>

            {/* การแมพ */}
            <div className="border-t pt-4">
              {aiOrder.mappedOrderId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-green-600">แมพกับ Order:</span>
                    <span className="ml-2 font-mono">#{aiOrder.mappedOrderId.slice(-8).toUpperCase()}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      โดย {aiOrder.mappedBy} เมื่อ {formatDate(aiOrder.mappedAt!)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnmapOrder(aiOrder._id)}
                    disabled={saving[aiOrder._id]}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving[aiOrder._id] ? 'กำลังยกเลิก...' : 'ยกเลิกแมพ'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <select
                    value={mapping[aiOrder._id] || ''}
                    onChange={(e) => setMapping(prev => ({ ...prev, [aiOrder._id]: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือก Order ที่จะแมพ</option>
                    {orders.map((order) => (
                      <option key={order._id} value={order._id}>
                        #{order._id.slice(-8).toUpperCase()} - {order.customerName} - {order.totalAmount.toLocaleString()} บาท
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleMapOrder(aiOrder._id, mapping[aiOrder._id])}
                    disabled={!mapping[aiOrder._id] || saving[aiOrder._id]}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving[aiOrder._id] ? 'กำลังแมพ...' : 'แมพ Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {aiOrders.length === 0 ? 'ไม่มี AI Orders' : 'ไม่มี AI Orders ที่ตรงกับเงื่อนไขที่เลือก'}
          </div>
        </div>
      )}
    </div>
  );
}
