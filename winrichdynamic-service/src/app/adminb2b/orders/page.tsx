'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  items?: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  shippingFee: number;
  discount?: number;
  paymentMethod?: 'cod' | 'transfer';
  deliveryMethod?: 'standard' | 'lalamove';
  trackingNumber?: string;
  shippingProvider?: string;
  status?: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  orderDate?: string;
};

type SortKey = 'createdAt' | 'total';
type SortDir = 'desc' | 'asc';

export default function AdminB2BOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [changingId, setChangingId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('โหลดคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalWithShipping = (o: Order) => (o.totalAmount || 0) + (o.shippingFee || 0) - (o.discount || 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = [...orders];
    if (q) {
      arr = arr.filter((o) =>
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').toLowerCase().includes(q) ||
        (o._id || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) arr = arr.filter((o) => (o.status || '') === statusFilter);
    arr.sort((a, b) => {
      if (sortKey === 'createdAt') {
        const av = new Date(a.createdAt).getTime();
        const bv = new Date(b.createdAt).getTime();
        return sortDir === 'desc' ? bv - av : av - bv;
      } else {
        const av = totalWithShipping(a);
        const bv = totalWithShipping(b);
        return sortDir === 'desc' ? bv - av : av - bv;
      }
    });
    return arr;
  }, [orders, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir]);

  const getStatusColor = (status?: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-indigo-100 text-indigo-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status?: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'รอดำเนินการ';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'ready':
        return 'พร้อมส่ง';
      case 'shipped':
        return 'จัดส่งแล้ว';
      case 'delivered':
        return 'ส่งมอบแล้ว';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return '-';
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(v || 0);
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  async function changeStatus(order: Order, status: NonNullable<Order['status']>) {
    if (order.status === status) return;
    try {
      setChangingId(order._id);
      const token = typeof window !== 'undefined' ? localStorage.getItem('b2b_auth_token') : '';
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        alert(err?.error || 'อัปเดตสถานะไม่สำเร็จ');
      } else {
        await load();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setChangingId('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold">การจัดการออเดอร์ (B2B)</h1>
            <div className="text-sm text-gray-600">รวม {orders.length} รายการ</div>
          </div>
        </div>
        {error ? (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        ) : null}

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อ เบอร์ หรือรหัสออเดอร์"
              className="w-full border rounded-md px-3 py-2 bg-white"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="ready">พร้อมส่ง</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="delivered">ส่งมอบแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div>
            <select
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(':') as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="createdAt:desc">ล่าสุดก่อน</option>
              <option value="createdAt:asc">เก่าก่อน</option>
              <option value="total:desc">ยอดรวมมาก → น้อย</option>
              <option value="total:asc">ยอดรวมน้อย → มาก</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ออเดอร์</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เบอร์</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชำระ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ยอดรวม</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สร้างเมื่อ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                      <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      ไม่พบออเดอร์ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  paged.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-gray-900">#{o._id.slice(-6)}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[160px]" title={o._id}>{o._id}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-gray-900">{o.customerName}</div>
                        <div className="text-xs text-gray-500">{o.items?.length || 0} รายการ</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm text-gray-900">{o.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-xs inline-flex px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {o.paymentMethod === 'transfer' ? 'โอน' : 'เก็บเงินปลายทาง'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(totalWithShipping(o))}</div>
                        {o.discount ? (
                          <div className="text-xs text-gray-500">รวมก่อนส่วนลด {formatCurrency((o.totalAmount || 0) + (o.shippingFee || 0))}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </div>
                        <div className="mt-1">
                          <select
                            value={o.status || 'pending'}
                            onChange={(e) => changeStatus(o, e.target.value as NonNullable<Order['status']>)}
                            disabled={changingId === o._id}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            title="เปลี่ยนสถานะ"
                          >
                            <option value="pending">รอดำเนินการ</option>
                            <option value="confirmed">ยืนยันแล้ว</option>
                            <option value="ready">พร้อมส่ง</option>
                            <option value="shipped">จัดส่งแล้ว</option>
                            <option value="delivered">ส่งมอบแล้ว</option>
                            <option value="cancelled">ยกเลิก</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm text-gray-900">{formatDate(o.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => (location.href = `/adminb2b/orders/${o._id}`)}
                            className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
                            title="ดูรายละเอียด"
                          >
                            ดูรายละเอียด
                          </button>
                          {o.trackingNumber ? (
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700" title={`Tracking: ${o.trackingNumber}`}>
                              {o.shippingProvider || 'ขนส่ง'}: {o.trackingNumber}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
              <div className="text-sm text-gray-600">
                หน้า {currentPage} / {totalPages} — แสดง {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} จาก {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ก่อนหน้า
                </button>
                <button
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
