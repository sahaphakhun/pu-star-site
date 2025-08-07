'use client';

import React, { useEffect, useState } from 'react';

interface CatalogItem {
  _id: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data?.items) setItems(data.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ไฟล์แคตตาล็อก</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">ยังไม่มีไฟล์</p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg border">
          {items.map((it) => (
            <li key={it._id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-xs text-gray-500">{it.fileType || ''}</p>
              </div>
              <a
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                href={it.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                ดาวน์โหลด
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


