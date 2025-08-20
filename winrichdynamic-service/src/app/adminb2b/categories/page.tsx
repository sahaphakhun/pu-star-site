'use client';

import React, { useEffect, useState } from 'react';

type Category = { _id: string; name: string; slug?: string };

export default function AdminB2BCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('โหลดหมวดหมู่ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || 'สร้างหมวดหมู่ไม่สำเร็จ');
      }
      setName(''); setSlug('');
      await load();
      alert('สร้างหมวดหมู่เรียบร้อย');
    } catch (e: any) {
      setError(e?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">หมวดหมู่ (B2B)</h1>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-white">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อหมวดหมู่</label>
          <input className="w-full border px-3 py-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (ไม่บังคับ)</label>
          <input className="w-full border px-3 py-2 rounded" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">สร้างหมวดหมู่</button>
        </div>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      {loading ? (
        <div>กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="border rounded-lg p-4 bg-white">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-gray-500">{c.slug || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


