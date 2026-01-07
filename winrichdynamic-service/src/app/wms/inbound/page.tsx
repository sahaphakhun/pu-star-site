'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Loading from '@/components/ui/Loading';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  totalItems: number;
  receivedItems: number;
  totalValue: number;
}

interface ASN {
  id: string;
  asnNumber: string;
  poNumber: string;
  supplier: string;
  deliveryDate: string;
  status: 'pending' | 'receiving' | 'completed';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    expectedQty: number;
    receivedQty: number;
    unit: string;
    lotNumber?: string;
    expiryDate?: string;
  }>;
}

const InboundPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [asns, setAsns] = useState<ASN[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'po' | 'asn' | 'receiving'>('po');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wms/inbound', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
      setPurchaseOrders(Array.isArray(data?.purchaseOrders) ? data.purchaseOrders : []);
      setAsns(Array.isArray(data?.asns) ? data.asns : []);
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
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'receiving': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รอการจัดส่ง';
      case 'partial': return 'รับบางส่วน';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      case 'receiving': return 'กำลังรับ';
      default: return status;
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
        <Loading size="lg" label="กำลังโหลดข้อมูลรับสินค้า..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ระบบรับสินค้า (Inbound)</h1>
        <p className="text-gray-600">จัดการการรับสินค้า, Purchase Order, และ ASN</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">สร้าง PO</div>
            <div className="text-sm opacity-90">Purchase Order</div>
          </div>
        </button>

        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">สร้าง ASN</div>
            <div className="text-sm opacity-90">Advance Shipping Notice</div>
          </div>
        </button>

        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-semibold">ตรวจสอบสินค้า</div>
            <div className="text-sm opacity-90">Quality Check</div>
          </div>
        </button>

        <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">🏷️</div>
            <div className="font-semibold">พิมพ์บาร์โค้ด</div>
            <div className="text-sm opacity-90">Print Labels</div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('po')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'po'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('asn')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'asn'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ASN (Advance Shipping Notice)
            </button>
            <button
              onClick={() => setActiveTab('receiving')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'receiving'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              การรับสินค้า
            </button>
          </nav>
        </div>
      </div>

      {/* Purchase Orders Tab */}
      {activeTab === 'po' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                + สร้าง PO ใหม่
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
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
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{po.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(po.orderDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(po.expectedDelivery)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                        {getStatusLabel(po.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(po.receivedItems / po.totalItems) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {po.receivedItems}/{po.totalItems}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(po.totalValue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          ดูรายละเอียด
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                          สร้าง ASN
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

      {/* ASN Tab */}
      {activeTab === 'asn' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">ASN (Advance Shipping Notice)</h3>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                + สร้าง ASN ใหม่
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ASN Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asns.map((asn) => (
                  <tr key={asn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asn.asnNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asn.poNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asn.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(asn.deliveryDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asn.status)}`}>
                        {getStatusLabel(asn.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asn.items.length} รายการ</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          ดูรายละเอียด
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                          เริ่มรับสินค้า
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

      {/* Receiving Tab */}
      {activeTab === 'receiving' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การรับสินค้า</h3>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">ยังไม่มีรายการรับสินค้า</div>
            <p className="text-gray-400">เลือก ASN เพื่อเริ่มกระบวนการรับสินค้า</p>
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
              <p className="text-sm font-medium text-gray-500">Purchase Orders</p>
              <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
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
              <p className="text-sm font-medium text-gray-500">ASN</p>
              <p className="text-2xl font-bold text-gray-900">{asns.length}</p>
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
              <p className="text-sm font-medium text-gray-500">รอการจัดส่ง</p>
              <p className="text-2xl font-bold text-orange-600">
                {purchaseOrders.filter(po => po.status === 'pending').length}
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
                {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.totalValue, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboundPage;
