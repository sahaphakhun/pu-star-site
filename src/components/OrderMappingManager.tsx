'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface OrderMappingStats {
  totalOrders: number;
  mappedOrders: number;
  unmappedOrders: number;
  mappingRate: string;
}

interface UnmappedOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  createdAt: string;
  status: string;
}

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  customerType?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

interface OrderMappingManagerProps {
  onMappingComplete?: () => void;
}

const OrderMappingManager: React.FC<OrderMappingManagerProps> = ({ onMappingComplete }) => {
  const [stats, setStats] = useState<OrderMappingStats | null>(null);
  const [unmappedOrders, setUnmappedOrders] = useState<UnmappedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualMapping, setShowManualMapping] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UnmappedOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // โหลดสถิติ
  const loadStats = async () => {
    try {
      const response = await fetch('/api/orders/mapping?action=stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสถิติ');
    }
  };

  // โหลดออเดอร์ที่ยังไม่ได้ mapping
  const loadUnmappedOrders = async () => {
    try {
      const response = await fetch('/api/orders/mapping?action=unmapped');
      const data = await response.json();
      if (data.success) {
        setUnmappedOrders(data.data);
      }
    } catch (error) {
      console.error('Error loading unmapped orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดออเดอร์');
    }
  };

  // Auto mapping
  const handleAutoMapping = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-map' })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Auto mapping สำเร็จ: ${data.data.successCount} รายการ`);
        await loadStats();
        await loadUnmappedOrders();
        onMappingComplete?.();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการ auto mapping');
      }
    } catch (error) {
      console.error('Error in auto mapping:', error);
      toast.error('เกิดข้อผิดพลาดในการ auto mapping');
    } finally {
      setLoading(false);
    }
  };

  // Batch sync
  const handleBatchSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch-sync' })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Batch sync สำเร็จ: ${data.data.successCount} รายการ`);
        await loadStats();
        await loadUnmappedOrders();
        onMappingComplete?.();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการ batch sync');
      }
    } catch (error) {
      console.error('Error in batch sync:', error);
      toast.error('เกิดข้อผิดพลาดในการ batch sync');
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาผู้ใช้
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setSearching(false);
    }
  };

  // Manual mapping
  const handleManualMapping = async (orderId: string, userId: string) => {
    try {
      const response = await fetch('/api/orders/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual-map', orderId, userId })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('เชื่อมโยงออเดอร์กับผู้ใช้สำเร็จ');
        setShowManualMapping(false);
        setSelectedOrder(null);
        setSearchQuery('');
        setSearchResults([]);
        await loadStats();
        await loadUnmappedOrders();
        onMappingComplete?.();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมโยง');
      }
    } catch (error) {
      console.error('Error in manual mapping:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมโยง');
    }
  };

  // เปิด modal manual mapping
  const openManualMapping = (order: UnmappedOrder) => {
    setSelectedOrder(order);
    setShowManualMapping(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    loadStats();
    loadUnmappedOrders();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* สถิติ */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">ออเดอร์ทั้งหมด</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">เชื่อมโยงแล้ว</div>
            <div className="text-2xl font-bold text-green-600">{stats.mappedOrders}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">ยังไม่ได้เชื่อมโยง</div>
            <div className="text-2xl font-bold text-red-600">{stats.unmappedOrders}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">อัตราการเชื่อมโยง</div>
            <div className="text-2xl font-bold text-blue-600">{stats.mappingRate}%</div>
          </div>
        </div>
      )}

      {/* ปุ่มดำเนินการ */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleAutoMapping}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'กำลังดำเนินการ...' : 'Auto Mapping'}
        </button>
        <button
          onClick={handleBatchSync}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'กำลังดำเนินการ...' : 'Batch Sync'}
        </button>
      </div>

      {/* รายการออเดอร์ที่ยังไม่ได้ mapping */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">ออเดอร์ที่ยังไม่ได้เชื่อมโยง</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">เบอร์โทร</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">วันที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unmappedOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{order.customerPhone}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">฿{order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openManualMapping(order)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      จัดการ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Manual Mapping */}
      <AnimatePresence>
        {showManualMapping && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowManualMapping(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">เชื่อมโยงออเดอร์กับผู้ใช้</h3>
                <button
                  onClick={() => setShowManualMapping(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ข้อมูลออเดอร์ */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">ข้อมูลออเดอร์</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ลูกค้า:</span> {selectedOrder.customerName}
                  </div>
                  <div>
                    <span className="text-gray-600">เบอร์โทร:</span> {selectedOrder.customerPhone}
                  </div>
                  <div>
                    <span className="text-gray-600">ยอดรวม:</span> ฿{selectedOrder.totalAmount.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-600">สถานะ:</span> {selectedOrder.status}
                  </div>
                </div>
              </div>

              {/* ค้นหาผู้ใช้ */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาผู้ใช้
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อ, เบอร์โทร, หรืออีเมล"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* ผลการค้นหา */}
              {searching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleManualMapping(selectedOrder._id, user._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.phoneNumber}</div>
                          {user.email && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>ออเดอร์: {user.totalOrders || 0}</div>
                          <div>ยอดรวม: ฿{(user.totalSpent || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  ไม่พบผู้ใช้ที่ตรงกับคำค้นหา
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderMappingManager;
