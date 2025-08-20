'use client';

import React, { useEffect, useState } from 'react';

export default function AdminB2BOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ');
        setOrder(data);
      } catch (e: any) {
        setError(e?.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!order) return <div className="p-6">ไม่พบคำสั่งซื้อ</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order._id}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">ข้อมูลลูกค้า</div>
          <div>ชื่อ: {order.customerName}</div>
          <div>เบอร์: {order.customerPhone}</div>
          <div>วิธีชำระเงิน: {order.paymentMethod}</div>
          <div>สถานะ: {order.status}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">สรุปยอด</div>
          <div>ค่าสินค้า: ฿{order.totalAmount?.toLocaleString()}</div>
          <div>ค่าส่ง: ฿{order.shippingFee?.toLocaleString()}</div>
          <div className="font-semibold mt-1">รวม: ฿{(order.totalAmount + (order.shippingFee || 0))?.toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-2">รายการสินค้า</div>
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="py-1">สินค้า</th>
              <th className="py-1">จำนวน</th>
              <th className="py-1">ราคา</th>
              <th className="py-1">รวม</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it: any, idx: number) => (
              <tr key={idx}>
                <td className="py-1">{it.name}</td>
                <td className="py-1">{it.quantity}</td>
                <td className="py-1">฿{it.price?.toLocaleString()}</td>
                <td className="py-1">฿{(it.price * it.quantity)?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


