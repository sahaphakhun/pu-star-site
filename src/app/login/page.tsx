'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// สร้าง Component แยกที่ใช้ useSearchParams
const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/shop';

  const { isLoggedIn, login: setAuthUser } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.message || 'กรุณารอสักครู่ก่อนส่งรหัสใหม่');
      } else if (data.success) {
        setIsOtpSent(true);
        setCountdown(60); // ตั้งเวลานับถอยหลัง 60 วินาที
        
        // หากเป็นโหมดพัฒนา และมีค่า OTP ส่งกลับมา
        if (data.otp) {
          setOtp(data.otp);
        }
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
      }
    } catch (_error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 6) {
      setError('กรุณากรอกรหัส OTP ให้ถูกต้อง');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber,
          otp
        }),
      });

      const data = await response.json();

      if (data.success) {
        // อัปเดต AuthContext ทันที
        if (data.user) {
          setAuthUser(data.user);
        }
        router.push(returnUrl);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
      }
    } catch (_error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // หากล็อกอินแล้ว แสดงข้อความและปุ่มกลับทันที
  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">คุณได้เข้าสู่ระบบแล้ว</h1>
          <p className="text-gray-600">ไม่จำเป็นต้องยืนยัน OTP อีกครั้ง</p>
          <button
            onClick={() => router.push(returnUrl)}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ไปยังหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            เข้าสู่ระบบด้วยเบอร์โทรศัพท์ของคุณ
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-lg text-sm sm:text-base" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!isOtpSent ? (
          /* Phone Number Form */
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                id="phone-number"
                name="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.trim())}
                className="w-full px-4 py-4 sm:py-3 text-lg sm:text-base border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="กรอกเบอร์โทรศัพท์"
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              } w-full flex justify-center py-4 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg sm:text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังส่งรหัส...</span>
                </div>
              ) : (
                '📱 ส่งรหัส OTP'
              )}
            </button>
          </form>
        ) : (
          /* OTP Verification Form */
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                รหัส OTP (6 หลัก)
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-4 sm:py-3 text-xl sm:text-lg text-center tracking-widest border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                กรุณากรอกรหัส OTP ที่ส่งไปยังเบอร์ {phoneNumber}
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                className={`text-sm font-medium ${
                  countdown > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-500'
                } transition-colors`}
                onClick={handleSendOTP}
                disabled={countdown > 0}
              >
                {countdown > 0 ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>ส่งรหัสอีกครั้งใน {countdown} วินาที</span>
                  </div>
                ) : (
                  '🔄 ส่งรหัสอีกครั้ง'
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              } w-full flex justify-center py-4 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg sm:text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังยืนยัน...</span>
                </div>
              ) : (
                '✅ ยืนยันรหัส OTP'
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                หรือ
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/shop" className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              🏠 กลับไปที่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// แสดงผล Loading ขณะที่ component หลักกำลังโหลด
const LoginFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">กำลังโหลด...</p>
      </div>
    </div>
  );
};

// Component หลัก
const LoginPage = () => {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage; 