'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CatalogItem {
  _id: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
}

export default function AdminCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);

  const load = async () => {
    const res = await fetch('/api/catalog');
    const data = await res.json();
    setItems(data?.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const res = await fetch('/api/catalog', { method: 'POST', body: fd });
    if (res.ok) {
      formRef.current.reset();
      load();
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/catalog?id=${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์แล้ว');
    } catch {
      // fallback
      prompt('คัดลอกลิงก์ด้วยตนเอง:', url);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">จัดการไฟล์ Catalog</h1>

      <form ref={formRef} onSubmit={onSubmit} className="bg-white p-4 border rounded-lg mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อไฟล์</label>
          <input name="title" className="w-full border rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่ (ไม่บังคับ)</label>
          <input name="category" className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">อัพโหลดไฟล์ (PDF/อื่นๆ)</label>
          <input name="file" type="file" className="w-full" required />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md">บันทึก</button>
      </form>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <ul className="divide-y bg-white rounded-lg border">
          {items.map((it) => (
            <li key={it._id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-xs text-gray-500">
                  {it.fileType || 'unknown'}
                  {it.fileSize ? ` · ${formatBytes(it.fileSize)}` : ''}
                  {it.category ? ` · ${it.category}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyLink(it.fileUrl)} className="px-2 py-1 text-sm border rounded-md">คัดลอกลิงก์</button>
                <a className="px-2 py-1 text-sm border rounded-md" href={it.fileUrl} target="_blank" rel="noreferrer">เปิด</a>
                <button onClick={() => onDelete(it._id)} className="px-2 py-1 text-sm border rounded-md text-red-600">ลบ</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


