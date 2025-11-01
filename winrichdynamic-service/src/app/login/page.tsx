'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setIsOtpSent(true);
        setCountdown(30); // เริ่มนับถอยหลัง 30 วินาที
        
        // นับถอยหลัง
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast.success('ส่งรหัส OTP เรียบร้อยแล้ว');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
        toast.error(data.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('เกิดข้อผิดพลาดในการส่ง OTP');
      toast.error('เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!otp || otp.length < 6) {
      setError('กรุณากรอกรหัส OTP ให้ถูกต้อง');
      toast.error('กรุณากรอกรหัส OTP ให้ถูกต้อง');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otp,
          name: phoneNumber, // ใช้เบอร์โทรเป็นชื่อเริ่มต้น
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        router.push('/'); // ไปหน้าหลัก
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
        toast.error(data.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('เกิดข้อผิดพลาดในการยืนยัน OTP');
      toast.error('เกิดข้อผิดพลาดในการยืนยัน OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    setOtp('');
    setIsOtpSent(false);
    handleSendOTP(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรุณากรอกเบอร์โทรศัพท์เพื่อรับรหัส OTP
          </p>
        </div>

        {!isOtpSent ? (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="08xxxxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !phoneNumber || phoneNumber.length < 10}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังส่ง OTP...' : 'ส่งรหัส OTP'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    รหัส OTP ได้ถูกส่งไปยังเบอร์ {phoneNumber} แล้ว
                  </p>
                </div>
              </div>
            </div>

            {/* OTP Verification Form */}
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
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                />
                <p className="mt-2 text-sm text-gray-600">
                  กรุณากรอกรหัส OTP ที่ส่งไปยังเบอร์ {phoneNumber}
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !otp || otp.length !== 6}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `ส่งใหม่ใน ${countdown} วินาที` : 'ส่ง OTP ใหม่'}
                </button>
              </div>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                เปลี่ยนเบอร์โทรศัพท์
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
