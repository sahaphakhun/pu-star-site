'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CustomerLoginWithCodePage() {
  const [customerCode, setCustomerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCode || !phone) {
      toast.error('กรุณากรอกรหัสลูกค้าและเบอร์โทร');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerCode: customerCode.trim().toUpperCase(), phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success('ส่ง OTP แล้ว');
        setOtpSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data?.message || 'ส่ง OTP ไม่สำเร็จ');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('กรุณากรอก OTP 6 หลัก');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerCode: customerCode.trim().toUpperCase(), phoneNumber: phone.trim(), otp }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        // token ถูกตั้งเป็น cookie แล้ว สามารถพาไปที่หน้า my-orders หรือหน้าแรกได้
        window.location.href = '/my-orders';
      } else {
        toast.error(data?.message || 'ยืนยัน OTP ไม่สำเร็จ');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการยืนยัน OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg border shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">เข้าสู่ระบบด้วยรหัสลูกค้า</h1>
        <p className="text-sm text-gray-600 mb-6">กรอก "รหัสลูกค้า" และ "เบอร์โทรที่ได้รับอนุญาต" เพื่อรับ OTP</p>

        {!otpSent ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสลูกค้า</label>
              <input
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น A1B2"
                maxLength={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0812345678 หรือ 66xxxxxxxxx"
                maxLength={12}
                required
              />
              <p className="text-xs text-gray-500 mt-1">ต้องเป็นเบอร์ที่ได้รับอนุญาตในข้อมูลลูกค้า</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่ง OTP'} {countdown>0 ? `(${countdown}s)` : ''}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัส OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                {loading ? 'กำลังยืนยัน...' : 'ยืนยัน'}
              </button>
              <button type="button" disabled={countdown>0} onClick={sendOtp} className="px-3 py-2 border rounded-md text-gray-700 disabled:opacity-50">
                ส่งใหม่ {countdown>0 ? `(${countdown})` : ''}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

