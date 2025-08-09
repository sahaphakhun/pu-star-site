'use client';

import React, { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { isAdmin, hasPermission, loading } = usePermissions();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isAdmin || hasPermission(PERMISSIONS.SETTINGS_GENERAL);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings/logo', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setLogoUrl(data.data.logoUrl);
          setSiteName(data.data.siteName);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const files = inputEl.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsSaving(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('siteName', siteName || '');

      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'อัพโหลดไม่สำเร็จ');

      setLogoUrl(data.data.logoUrl);
      toast.success('อัพโหลดโลโก้สำเร็จ');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setIsSaving(false);
      if (inputEl) inputEl.value = '';
    }
  };

  if (loading) return null;
  if (!canEdit) return <div className="p-6">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-semibold mb-6">ตั้งค่าทั่วไป</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเว็บไซต์</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="เช่น WINRICH DYNAMIC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">โลโก้ปัจจุบัน</label>
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <Image src={logoUrl} alt="Site Logo" width={96} height={96} className="rounded border" />
              <a href={logoUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">เปิดรูป</a>
            </div>
          ) : (
            <div className="text-sm text-gray-500">ยังไม่มีโลโก้</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">อัพโหลดโลโก้ใหม่</label>
          <input type="file" accept="image/*" onChange={onUpload} disabled={isSaving} />
          <p className="text-xs text-gray-500 mt-2">รองรับ PNG, JPG, WEBP, SVG</p>
        </div>
      </div>
    </div>
  );
}


