"use client";
import React, { useEffect, useState } from 'react';

type Approval = {
  _id: string;
  targetType: 'deal';
  targetId: string;
  requestedBy: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  decisionReason?: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/approvals?status=pending');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : (data?.data || []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, status: 'approved' | 'rejected') {
    const reason = window.prompt('เหตุผล (optional)') || '';
    const res = await fetch(`/api/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, decisionReason: reason }),
    });
    if (res.ok) {
      await load();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">คำขออนุมัติ</h1>
      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">เป้าหมาย</th>
              <th className="p-2">ผู้ขอ</th>
              <th className="p-2">เหตุผล</th>
              <th className="p-2">เมื่อ</th>
              <th className="p-2">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} className="border-t">
                <td className="p-2">{it.targetType}:{it.targetId}</td>
                <td className="p-2">{it.requestedBy}</td>
                <td className="p-2">{it.reason || '-'}</td>
                <td className="p-2">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => act(it._id, 'approved')}>อนุมัติ</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => act(it._id, 'rejected')}>ปฏิเสธ</button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={5}>ไม่มีคำขออนุมัติ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


