'use client';

import React, { useEffect, useState } from 'react';

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  shippingFee: number;
  status?: string;
  createdAt: string;
};

export default function AdminB2BOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">รายการคำสั่งซื้อ (B2B)</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>กำลังโหลด...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border">ลูกค้า</th>
                <th className="text-left px-3 py-2 border">เบอร์</th>
                <th className="text-right px-3 py-2 border">ยอดรวม</th>
                <th className="text-left px-3 py-2 border">สถานะ</th>
                <th className="text-left px-3 py-2 border">วันที่</th>
                <th className="text-left px-3 py-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => (location.href = `/adminb2b/orders/${o._id}`)}>
                  <td className="px-3 py-2 border">{o.customerName}</td>
                  <td className="px-3 py-2 border">{o.customerPhone}</td>
                  <td className="px-3 py-2 border text-right">฿{(o.totalAmount + (o.shippingFee || 0)).toLocaleString()}</td>
                  <td className="px-3 py-2 border">{o.status || '-'}</td>
                  <td className="px-3 py-2 border">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 border">
                    <button
                      className="px-3 py-1 text-sm rounded border"
                      onClick={async () => {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('b2bToken') : '';
                        const status = prompt('อัปเดตสถานะ (pending/confirmed/ready/shipped/delivered/cancelled)', o.status || 'pending') || o.status || 'pending';
                        const res = await fetch(`/api/orders/${o._id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ status }),
                        });
                        if (!res.ok) alert('อัปเดตสถานะไม่สำเร็จ'); else { await load(); alert('อัปเดตสถานะเรียบร้อย'); }
                      }}
                    >เปลี่ยนสถานะ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


