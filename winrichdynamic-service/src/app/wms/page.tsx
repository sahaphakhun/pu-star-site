'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Loading from '@/components/ui/Loading';

interface WMSStats {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  recentMovements: Array<{
    id: string;
    productName: string;
    type: 'in' | 'out' | 'adjust';
    quantity: number;
    unit: string;
    date: string;
    reference: string;
  }>;
}

const WMSPage: React.FC = () => {
  const [stats, setStats] = useState<WMSStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/wms/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลสถิติได้');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjust': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'รับเข้า';
      case 'out': return 'ส่งออก';
      case 'adjust': return 'ปรับปรุง';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" label="กำลังโหลดข้อมูลคลังสินค้า..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ภาพรวมระบบจัดการคลังสินค้า</h1>
        <p className="text-gray-600">ดูสถิติและข้อมูลสรุปของคลังสินค้า</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/wms/inventory"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">สินค้าคงคลัง</p>
              <p className="text-lg font-semibold text-gray-900">จัดการสินค้า</p>
            </div>
          </div>
        </Link>

        <Link
          href="/wms/movements"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">การเคลื่อนไหว</p>
              <p className="text-lg font-semibold text-gray-900">จัดการสต็อก</p>
            </div>
          </div>
        </Link>

        <Link
          href="/wms/reports"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">รายงาน</p>
              <p className="text-lg font-semibold text-gray-900">ดูสถิติ</p>
            </div>
          </div>
        </Link>

        <Link
          href="/adminb2b/products"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">เพิ่มสินค้า</p>
              <p className="text-lg font-semibold text-gray-900">สินค้าใหม่</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">สต็อกรวม</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toLocaleString()}</p>
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
              <p className="text-sm font-medium text-gray-500">สต็อกต่ำ</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">มูลค่าสต็อก</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Status Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะสต็อก</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalProducts - stats.lowStockItems - stats.outOfStockItems}
            </div>
            <div className="text-sm text-gray-500">ปกติ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {stats.lowStockItems}
            </div>
            <div className="text-sm text-gray-500">สต็อกต่ำ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.outOfStockItems}
            </div>
            <div className="text-sm text-gray-500">หมดสต็อก</div>
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">การเคลื่อนไหวล่าสุด</h3>
            <Link
              href="/wms/movements"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ดูทั้งหมด →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อ้างอิง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentMovements.slice(0, 5).map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{movement.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                      {getMovementTypeLabel(movement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {movement.quantity} {movement.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{movement.reference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(movement.date)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {stats.recentMovements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">ไม่มีการเคลื่อนไหวล่าสุด</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WMSPage;
