'use client';

import React, { useEffect, useState } from 'react';

type Product = {
  _id: string;
  name: string;
  price?: number;
  description: string;
  imageUrl: string;
  category?: string;
  isAvailable?: boolean;
};

export default function AdminB2BProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('ทั่วไป');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resP, resC] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
      setProducts(Array.isArray(dataP) ? dataP : []);
      if (Array.isArray(dataC)) setCategories(dataC.map((c: any) => c.name).filter(Boolean));
    } catch (e: any) {
      setError('โหลดรายการสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('b2bToken') : '';
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          price: price === '' ? undefined : Number(price),
          description,
          imageUrl,
          category,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'สร้างสินค้าไม่สำเร็จ');
      }
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setCategory('ทั่วไป');
      await load();
      alert('สร้างสินค้าเรียบร้อย');
    } catch (e: any) {
      setError(e?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">จัดการสินค้า (B2B)</h1>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-white">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
          <input className="w-full border px-3 py-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ราคา (ใส่ได้หรือไม่ใส่ก็ได้ถ้ามีหน่วย)</label>
          <input className="w-full border px-3 py-2 rounded" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea className="w-full border px-3 py-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">รูปภาพ (URL)</label>
          <input className="w-full border px-3 py-2 rounded mb-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fd = new FormData();
              fd.append('file', f);
              const res = await fetch('/api/images/upload', { method: 'POST', body: fd });
              if (!res.ok) return alert('อัปโหลดรูปไม่สำเร็จ');
              const data = await res.json();
              setImageUrl(data.url);
              alert('อัปโหลดรูปสำเร็จ');
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
          <select className="w-full border px-3 py-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ทั่วไป">ทั่วไป</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">สร้างสินค้า</button>
        </div>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div>กำลังโหลด...</div>
        ) : (
          products.map((p) => (
            <div key={p._id} className="border rounded-lg p-4 bg-white">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">{p.category || 'ทั่วไป'}</div>
              <div className="mt-1">ราคา: {p.price !== undefined ? `฿${p.price.toLocaleString()}` : '-'}</div>
              <div className="text-xs text-gray-500 line-clamp-2 mt-2">{p.description}</div>
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 text-sm rounded border"
                  onClick={async () => {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('b2bToken') : '';
                    const ok = confirm('ลบสินค้านี้?');
                    if (!ok) return;
                    const res = await fetch(`/api/products/${p._id}`, {
                      method: 'DELETE',
                      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    });
                    if (!res.ok) {
                      alert('ลบสินค้าไม่สำเร็จ');
                    } else {
                      await load();
                      alert('ลบสินค้าเรียบร้อย');
                    }
                  }}
                >ลบ</button>
                <button
                  className="px-3 py-1 text-sm rounded border"
                  onClick={async () => {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('b2bToken') : '';
                    const newName = prompt('แก้ไขชื่อสินค้า', p.name) || p.name;
                    const res = await fetch(`/api/products/${p._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: JSON.stringify({ name: newName }),
                    });
                    if (!res.ok) {
                      alert('แก้ไขสินค้าไม่สำเร็จ');
                    } else {
                      await load();
                      alert('แก้ไขสินค้าเรียบร้อย');
                    }
                  }}
                >แก้ไข</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


