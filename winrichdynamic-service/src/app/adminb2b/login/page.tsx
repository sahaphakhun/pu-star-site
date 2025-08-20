'use client';

import React, { useState } from 'react';

export default function AdminB2BLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/adminb2b/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('เข้าสู่ระบบไม่สำเร็จ');
      location.href = '/adminb2b';
    } catch (e: any) {
      setError(e?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="max-w-md w-full p-6 bg-white rounded-lg border space-y-4">
        <h1 className="text-xl font-semibold">เข้าสู่ระบบ B2B Admin</h1>
        <p className="text-sm text-gray-600">วาง JWT token ที่ถูกต้องเพื่อเข้าถึงส่วนแอดมิน</p>
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">เข้าสู่ระบบ</button>
      </form>
    </div>
  );
}


