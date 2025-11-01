import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

export type Activity = {
  _id?: string;
  type: 'call' | 'meeting' | 'email' | 'task';
  subject: string;
  notes?: string;
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  scheduledAt?: string;
  remindBeforeMinutes?: number;
  status?: 'planned' | 'done' | 'cancelled' | 'postponed';
  postponeReason?: string;
  cancelReason?: string;
  createdAt?: string;
};

export default function ActivityTimeline({
  customerId,
  dealId,
  quotationId,
  quotationIds,
}: {
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  quotationIds?: string[];
}) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Activity>({ type: 'call', subject: '' });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (dealId) params.set('dealId', dealId);
    if (quotationId) params.append('quotationId', quotationId);
    if (quotationIds && quotationIds.length) {
      quotationIds.forEach((id) => params.append('quotationId', id));
    }
    params.set('limit', '100');
    const res = await fetch(`/api/activities?${params.toString()}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : (data?.data || []));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, dealId, quotationId, Array.isArray(quotationIds) ? quotationIds.join(',') : '']);

  async function submit() {
    const payload = { ...form, customerId, dealId, quotationId };
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm({ type: 'call', subject: '' });
      await load();
    }
  }

  async function updateStatus(id: string, status: 'done' | 'cancelled' | 'postponed') {
    const body: any = { status };
    if (status === 'cancelled') {
      // eslint-disable-next-line no-alert
      const reason = window.prompt('เหตุผลการยกเลิก (optional)') || '';
      if (reason) body.cancelReason = reason;
    }
    if (status === 'postponed') {
      // eslint-disable-next-line no-alert
      const reason = window.prompt('เหตุผลการเลื่อน (optional)') || '';
      if (reason) body.postponeReason = reason;
    }
    const res = await fetch(`/api/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Select value={form.type} onChange={(e: any) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="call">โทร</option>
            <option value="meeting">นัด</option>
            <option value="email">อีเมล</option>
            <option value="task">งาน</option>
          </Select>
          <Input placeholder="หัวข้อ" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <Input type="datetime-local" value={form.scheduledAt || ''} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
          <Input type="number" min={0} placeholder="เตือนล่วงหน้า (นาที)" value={form.remindBeforeMinutes ?? ''} onChange={(e) => setForm((f) => ({ ...f, remindBeforeMinutes: Number(e.target.value) }))} />
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={submit} disabled={!form.subject}>เพิ่มกิจกรรม</Button>
          </div>
        </div>
        <div className="mt-2">
          <Textarea placeholder="โน้ต (ถ้ามี)" value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">เวลา</th>
              <th className="p-2">ประเภท</th>
              <th className="p-2">หัวข้อ</th>
              <th className="p-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="p-2">{a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : '-'}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span>{a.subject}</span>
                    {a.notes && <span className="text-xs text-gray-500">{a.notes}</span>}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{a.status || 'planned'}</span>
                    {a._id && (
                      <>
                        <Button onClick={() => updateStatus(a._id!, 'done')}>Done</Button>
                        <Button onClick={() => updateStatus(a._id!, 'cancelled')}>Cancel</Button>
                        <Button onClick={() => updateStatus(a._id!, 'postponed')}>Postpone</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={4}>ยังไม่มีกิจกรรม</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
