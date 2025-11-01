'use client';

import React, { useEffect, useState } from 'react';

export default function MyOrdersPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/my-orders?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'โหลดคำสั่งซื้อไม่สำเร็จ');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">คำสั่งซื้อของฉัน</h1>
      <div className="flex gap-2 mb-4">
        <input className="border px-3 py-2 rounded w-full" placeholder="ใส่เบอร์โทรศัพท์ของคุณ" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={fetchOrders}>ค้นหา</button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>กำลังโหลด...</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="border rounded p-4 bg-white">
              <div className="font-semibold">เลขที่: {o._id}</div>
              <div>วันเวลา: {new Date(o.createdAt).toLocaleString()}</div>
              <div>สถานะ: {o.status}</div>
              <div>ยอดรวม: ฿{(o.totalAmount + (o.shippingFee || 0)).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


