'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminB2BLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/adminb2b/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        location.href = '/adminb2b';
      } else {
        toast.error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ B2B Admin</h1>
          <p className="text-sm text-gray-600 mt-2">กรุณาเข้าสู่ระบบเพื่อเข้าถึงส่วนแอดมิน</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@winrich.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ข้อมูลเข้าสู่ระบบเริ่มต้น: admin@winrich.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}


