'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { isValidPhoneNumber } from '@/utils/phoneUtils';

export default function AdminB2BRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    role: 'admin'
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ตรวจสอบเบอร์โทรศัพท์
    if (!isValidPhoneNumber(formData.phone)) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/adminb2b/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      const res = await fetch('/api/adminb2b/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, otp }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        // Redirect ไปหน้า login
        setTimeout(() => {
          window.location.href = '/adminb2b/login';
        }, 2000);
      } else {
        toast.error(result.error || 'สมัครสมาชิกไม่สำเร็จ');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิก B2B Admin</h1>
          <p className="text-sm text-gray-600 mt-2">กรุณากรอกข้อมูลเพื่อสมัครสมาชิก</p>
        </div>
        
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อ-นามสกุล"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0995429353 หรือ 0812345678"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                รองรับเบอร์โทรศัพท์ 9-10 หลัก (เช่น 0995429353, 0812345678)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@company.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบริษัท
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อบริษัท (ไม่บังคับ)"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="admin">ผู้ดูแลระบบ</option>
                <option value="manager">ผู้จัดการ</option>
                <option value="staff">พนักงาน</option>
              </select>
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
                กรุณากรอกรหัส 6 หลักที่ส่งไปยังเบอร์ {formData.phone}
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
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                กลับไปแก้ไขข้อมูล
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/adminb2b/login" className="text-blue-600 hover:text-blue-800 font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
