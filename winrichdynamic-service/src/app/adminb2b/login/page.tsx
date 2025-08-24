'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminB2BLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
              const res = await fetch('/api/adminb2b/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('ส่ง OTP เรียบร้อยแล้ว');
        setOtpSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error || 'ส่ง OTP ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('กรุณากรอก OTP 6 หลัก');
      return;
    }

    setLoading(true);
    try {
              const res = await fetch('/api/adminb2b/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        
        // เก็บ token ใน localStorage สำหรับใช้กับ API
        localStorage.setItem('b2b_auth_token', result.data.token);
        
        // รอสักครู่แล้ว redirect เพื่อให้ cookie ถูกตั้งค่า
        setTimeout(() => {
          window.location.href = '/adminb2b';
        }, 500);
      } else {
        toast.error(result.error || 'OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยัน OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    handleSendOtp(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ B2B Admin</h1>
          <p className="text-sm text-gray-600 mt-2">ล็อกอินด้วยเบอร์โทรศัพท์</p>
        </div>
        
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                id="phone"
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังส่ง OTP...' : 'ส่ง OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                รหัส OTP
              </label>
              <input
                id="otp"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                กรุณากรอกรหัส 6 หลักที่ส่งไปยังเบอร์ {phone}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `ส่งใหม่ใน ${countdown} วินาที` : 'ส่ง OTP ใหม่'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setPhone('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                เปลี่ยนเบอร์โทรศัพท์
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ยังไม่มีบัญชี?{' '}
            <Link href="/adminb2b/register" className="text-blue-600 hover:text-blue-800 font-medium">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


