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
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : (data?.data || []));
  }

  useEffect(() => { load(); }, [q, status, source]);

  async function createLead() {
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, email, company, source: source || 'other' }) });
    if (res.ok) {
      setName(''); setPhone(''); setEmail(''); setCompany('');
      await load();
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
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="new">ใหม่</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="converted">Converted</option>
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value)}>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input placeholder="ชื่อ" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="โทร" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="บริษัท" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Button onClick={createLead} disabled={!name}>เพิ่ม Lead</Button>
        </div>
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


