'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTokenManager } from '@/utils/tokenManager';

interface AdminInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  role: string;
  roleLevel: number;
  lastLoginAt: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { getValidToken, logout, isAuthenticated, loading: authLoading } = useTokenManager();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // ตรวจสอบ authentication เมื่อโหลดหน้า
    if (!authLoading && !isAuthenticated) {
      logout();
      return;
    }
    
    if (isAuthenticated) {
      loadAdminInfo();
    }
  }, [isAuthenticated, authLoading, logout]);

  const loadAdminInfo = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/adminb2b/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAdminInfo(result.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะออกจากระบบ?')) {
      await logout();
      toast.success('ออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // แสดง loading ถ้ายังไม่เสร็จการตรวจสอบ authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // แสดงหน้า login ถ้าไม่ได้ authentication
  if (!isAuthenticated) {
    return null; // useTokenManager จะจัดการ redirect ไปหน้า login
  }

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
            <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
            <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวและการตั้งค่าระบบ</p>
          </div>

          {/* Profile Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.name || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.phone || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.email || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">บริษัท</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.company || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.role || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ระดับสิทธิ์</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  ระดับ {adminInfo?.roleLevel || 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลบัญชี</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เข้าสู่ระบบล่าสุด</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.lastLoginAt ? new Date(adminInfo.lastLoginAt).toLocaleString('th-TH') : 'ไม่ระบุ'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สร้างบัญชี</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {adminInfo?.createdAt ? new Date(adminInfo.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลระบบ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-800 font-medium">เวอร์ชันระบบ</div>
                <div className="text-2xl font-bold text-blue-900">1.0.0</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">สถานะระบบ</div>
                <div className="text-2xl font-bold text-green-900">พร้อมใช้งาน</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-800 font-medium">โหมด</div>
                <div className="text-2xl font-bold text-purple-900">
                  {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              ออกจากระบบ
            </button>
            
            <button
              onClick={() => window.location.href = '/adminb2b'}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              กลับไปหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
