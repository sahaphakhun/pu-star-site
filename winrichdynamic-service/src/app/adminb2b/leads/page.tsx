"use client";
import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

type Lead = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  source: 'facebook' | 'line' | 'website' | 'referral' | 'other';
  score?: number;
  status: 'new' | 'qualified' | 'disqualified' | 'converted';
  createdAt: string;
};

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [formSource, setFormSource] = useState<'facebook' | 'line' | 'website' | 'referral' | 'other'>('other');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filterStatus) params.set('status', filterStatus);
    if (filterSource) params.set('source', filterSource);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : (data?.data || []));
  }

  useEffect(() => { load(); }, [q, filterStatus, filterSource]);

  async function createLead() {
    setFormError('');
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedCompany = company.trim();
    // client-side validation
    if (!trimmedName) {
      setFormError('กรุณากรอกชื่อ');
      return;
    }
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setFormError('อีเมลไม่ถูกต้อง');
      return;
    }
    // normalize: ตัดค่าว่างออกไม่ส่งขึ้น API
    const payload: Record<string, any> = { name: trimmedName, source: formSource };
    if (trimmedPhone) payload.phone = trimmedPhone;
    if (trimmedEmail) payload.email = trimmedEmail;
    if (trimmedCompany) payload.company = trimmedCompany;
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setName(''); setPhone(''); setEmail(''); setCompany(''); setFormSource('other');
        await load();
      } else {
        console.error('Create lead failed', { status: res.status, data });
        const message = data?.error || 'สร้าง Lead ไม่สำเร็จ';
        const details = Array.isArray(data?.details) ? '\n- ' + data.details.map((d: any) => d.message || JSON.stringify(d)).join('\n- ') : '';
        setFormError(`${message}${details}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function importCsv(files: FileList | null) {
    if (!files || !files.length) return;
    const fd = new FormData();
    fd.append('file', files[0]);
    await fetch('/api/import/leads', { method: 'POST', body: fd });
    if (fileRef.current) fileRef.current.value = '';
    await load();
  }

  async function convert(id: string) {
    const res = await fetch(`/api/leads/${id}/convert`, { method: 'POST' });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Leads</h1>
      <div className="flex items-center gap-2">
        <Input placeholder="ค้นหา..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="new">ใหม่</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="converted">Converted</option>
        </Select>
        <Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="">ทุกแหล่งที่มา</option>
          <option value="facebook">Facebook</option>
          <option value="line">Line</option>
          <option value="website">Website</option>
          <option value="referral">แนะนำ</option>
          <option value="other">อื่นๆ</option>
        </Select>
        <input type="file" accept=".csv" ref={fileRef} onChange={(e) => importCsv(e.target.files)} />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
          <Input placeholder="ชื่อ" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="โทร" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="บริษัท" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Select value={formSource} onChange={(e) => setFormSource(e.target.value as any)}>
            <option value="other">ที่มา: อื่นๆ</option>
            <option value="facebook">ที่มา: Facebook</option>
            <option value="line">ที่มา: Line</option>
            <option value="website">ที่มา: Website</option>
            <option value="referral">ที่มา: แนะนำ</option>
          </Select>
          <Button onClick={createLead} disabled={submitting || !name.trim()}>{submitting ? 'กำลังเพิ่ม...' : 'เพิ่ม Lead'}</Button>
        </div>
        {formError ? (
          <div className="text-red-600 text-sm mt-2 whitespace-pre-line">{formError}</div>
        ) : null}
      </Card>

      <Card className="p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">ชื่อ</th>
              <th className="p-2">ติดต่อ</th>
              <th className="p-2">บริษัท</th>
              <th className="p-2">ที่มา</th>
              <th className="p-2">สถานะ</th>
              <th className="p-2">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l._id} className="border-t">
                <td className="p-2">{l.name}</td>
                <td className="p-2">{l.phone || '-'} / {l.email || '-'}</td>
                <td className="p-2">{l.company || '-'}</td>
                <td className="p-2">{l.source}</td>
                <td className="p-2">{l.status}</td>
                <td className="p-2">
                  <Button onClick={() => convert(l._id)}>แปลงเป็นดีล</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


