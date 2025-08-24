'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface SystemStatus {
  isInitialized: boolean;
  adminCount: number;
  roleCount: number;
  systemStatus: string;
}

export default function DashboardPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/adminb2b/init');
      const result = await response.json();
      
      if (result.success) {
        setSystemStatus(result.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะระบบ');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะระบบ');
    } finally {
      setLoading(false);
    }
  };

  const initializeSystem = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะเริ่มต้นระบบ? การดำเนินการนี้จะสร้างข้อมูลเริ่มต้นในระบบ')) {
      return;
    }

    setInitializing(true);
    try {
      const response = await fetch('/api/adminb2b/init', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('เริ่มต้นระบบสำเร็จ');
        await checkSystemStatus(); // ตรวจสอบสถานะใหม่
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการเริ่มต้นระบบ');
      }
    } catch (error) {
      console.error('Error initializing system:', error);
      toast.error('เกิดข้อผิดพลาดในการเริ่มต้นระบบ');
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">B2B Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">จัดการระบบ B2B และตรวจสอบสถานะ</p>
          </div>

          {/* System Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">สถานะระบบ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-800 font-medium">สถานะระบบ</div>
                <div className="text-2xl font-bold text-blue-900">
                  {systemStatus?.isInitialized ? 'พร้อมใช้งาน' : 'รอเริ่มต้น'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">จำนวนแอดมิน</div>
                <div className="text-2xl font-bold text-green-900">
                  {systemStatus?.adminCount || 0}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-800 font-medium">จำนวนบทบาท</div>
                <div className="text-2xl font-bold text-purple-900">
                  {systemStatus?.roleCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">การดำเนินการ</h2>
            
            {!systemStatus?.isInitialized ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-800 text-lg font-medium">
                    ระบบยังไม่พร้อมใช้งาน
                  </div>
                </div>
                <p className="text-yellow-700 mb-4">
                  กรุณาเริ่มต้นระบบเพื่อสร้างข้อมูลพื้นฐานและแอดมินเริ่มต้น
                </p>
                <button
                  onClick={initializeSystem}
                  disabled={initializing}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initializing ? 'กำลังเริ่มต้น...' : 'เริ่มต้นระบบ'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-green-800 text-lg font-medium">
                    ระบบพร้อมใช้งาน
                  </div>
                </div>
                <p className="text-green-700 mb-4">
                  ระบบได้ถูกเริ่มต้นแล้ว คุณสามารถเข้าสู่ระบบและใช้งานได้
                </p>
                <div className="space-x-3">
                  <Link
                    href="/adminb2b/login"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/adminb2b/register"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    สมัครสมาชิกเพิ่ม
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ลิงก์ด่วน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/adminb2b/login"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">เข้าสู่ระบบ</div>
                <div className="text-sm text-gray-600">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</div>
              </Link>
              
              <Link
                href="/adminb2b/register"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">สมัครสมาชิก</div>
                <div className="text-sm text-gray-600">สร้างบัญชีแอดมินใหม่</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
