'use client';

import React, { useEffect, useState } from 'react';

type Category = { _id: string; name: string; description?: string; slug?: string };

export default function AdminB2BCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      // แก้ไขการจัดการ response ให้รองรับ format ใหม่
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
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
    
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result?.error || 'สร้างหมวดหมู่ไม่สำเร็จ');
      }
      
      setName(''); 
      setDescription('');
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
          <label className="block text-sm font-medium mb-1">ชื่อหมวดหมู่ *</label>
          <input 
            className="w-full border px-3 py-2 rounded" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">คำอธิบาย (ไม่บังคับ)</label>
          <input 
            className="w-full border px-3 py-2 rounded" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>
        <div className="md:col-span-2">
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างหมวดหมู่'}
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500">
              ยังไม่มีหมวดหมู่
            </div>
          ) : (
            categories.map((c) => (
              <div key={c._id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-gray-600 mt-1">{c.description || '-'}</div>
                <div className="text-xs text-gray-500 mt-2">Slug: {c.slug || '-'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


