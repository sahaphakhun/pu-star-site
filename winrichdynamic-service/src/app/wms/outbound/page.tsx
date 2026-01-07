'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/ui/Loading';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  orderDate: string;
  expectedDelivery: string;
  status: 'pending' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalItems: number;
  pickedItems: number;
  totalValue: number;
  shippingMethod: string;
}

interface PickingTask {
  id: string;
  taskNumber: string;
  orderNumber: string;
  picker: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    location: string;
    requiredQty: number;
    pickedQty: number;
    unit: string;
  }>;
  startTime?: string;
  completedTime?: string;
  estimatedDuration: number; // minutes
}

const OutboundPage: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [pickingTasks, setPickingTasks] = useState<PickingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'picking' | 'packing' | 'shipping'>('orders');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wms/outbound', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
      setSalesOrders(Array.isArray(data?.salesOrders) ? data.salesOrders : []);
      setPickingTasks(Array.isArray(data?.pickingTasks) ? data.pickingTasks : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'picking': return 'text-blue-600 bg-blue-100';
      case 'packing': return 'text-purple-600 bg-purple-100';
      case 'shipped': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รอการเบิก';
      case 'picking': return 'กำลังเบิก';
      case 'packing': return 'กำลังแพ็ค';
      case 'shipped': return 'จัดส่งแล้ว';
      case 'delivered': return 'ส่งมอบแล้ว';
      case 'cancelled': return 'ยกเลิก';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'ด่วนมาก';
      case 'high': return 'สูง';
      case 'medium': return 'ปานกลาง';
      case 'low': return 'ต่ำ';
      default: return priority;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" label="กำลังโหลดข้อมูลจ่ายสินค้า..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ระบบเบิกและจ่ายสินค้า (Outbound)</h1>
        <p className="text-gray-600">จัดการใบสั่งขาย, Picking, และการจัดส่ง</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">สร้างใบสั่งขาย</div>
            <div className="text-sm opacity-90">Sales Order</div>
          </div>
        </button>

        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">สร้าง Picking Task</div>
            <div className="text-sm opacity-90">Picking</div>
          </div>
        </button>

        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">แพ็คสินค้า</div>
            <div className="text-sm opacity-90">Packing</div>
          </div>
        </button>

        <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">🚚</div>
            <div className="font-semibold">จัดส่ง</div>
            <div className="text-sm opacity-90">Shipping</div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ใบสั่งขาย
            </button>
            <button
              onClick={() => setActiveTab('picking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'picking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Picking Tasks
            </button>
            <button
              onClick={() => setActiveTab('packing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'packing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              การแพ็ค
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shipping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              การจัดส่ง
            </button>
          </nav>
        </div>
      </div>

      {/* Sales Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">ใบสั่งขาย</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                + สร้างใบสั่งขายใหม่
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.expectedDelivery)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                        {getPriorityLabel(order.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(order.pickedItems / order.totalItems) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {order.pickedItems}/{order.totalItems}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(order.totalValue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          ดูรายละเอียด
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                          สร้าง Picking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Picking Tasks Tab */}
      {activeTab === 'picking' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Picking Tasks</h3>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                + สร้าง Picking Task
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Picker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pickingTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.taskNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.picker}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.items.length} รายการ</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.estimatedDuration} นาที</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          ดูรายละเอียด
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                          เริ่ม Picking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packing Tab */}
      {activeTab === 'packing' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การแพ็คสินค้า</h3>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">ยังไม่มีรายการแพ็ค</div>
            <p className="text-gray-400">รอการเบิกสินค้าเสร็จสิ้นเพื่อเริ่มการแพ็ค</p>
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === 'shipping' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดส่ง</h3>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">ยังไม่มีรายการจัดส่ง</div>
            <p className="text-gray-400">รอการแพ็คสินค้าเสร็จสิ้นเพื่อเริ่มการจัดส่ง</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">ใบสั่งขาย</p>
              <p className="text-2xl font-bold text-gray-900">{salesOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Picking Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{pickingTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">รอการเบิก</p>
              <p className="text-2xl font-bold text-orange-600">
                {salesOrders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">มูลค่ารวม</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesOrders.reduce((sum, order) => sum + order.totalValue, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboundPage;
