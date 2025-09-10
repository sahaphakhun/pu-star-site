'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useTokenManager } from '@/utils/tokenManager';

interface SystemStatus {
  isInitialized: boolean;
  adminCount: number;
  roleCount: number;
  systemStatus: string;
}

export default function DashboardPage() {
  const { getValidToken, logout, isAuthenticated, loading: authLoading } = useTokenManager();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [team, setTeam] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    // ตรวจสอบ authentication เมื่อโหลดหน้า
    if (!authLoading && !isAuthenticated) {
      logout();
      return;
    }
    
    if (isAuthenticated) {
      checkSystemStatus();
    }
  }, [isAuthenticated, authLoading, logout]);

  const checkSystemStatus = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/adminb2b/init', {
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

  const loadReports = async () => {
    try {
      const qs: string[] = [];
      if (team) qs.push(`team=${encodeURIComponent(team)}`);
      if (ownerId) qs.push(`ownerId=${encodeURIComponent(ownerId)}`);
      const query = qs.length ? `?${qs.join('&')}` : '';
      const res1 = await fetch(`/api/reports/deals-by-stage${query}`);
      const data1 = await res1.json();
      setDealsByStage(Array.isArray(data1) ? data1 : []);

      const qs2: string[] = [];
      if (team) qs2.push(`team=${encodeURIComponent(team)}`);
      if (ownerId) qs2.push(`ownerId=${encodeURIComponent(ownerId)}`);
      if (start) qs2.push(`start=${encodeURIComponent(start)}`);
      if (end) qs2.push(`end=${encodeURIComponent(end)}`);
      const query2 = qs2.length ? `?${qs2.join('&')}` : '';
      const res2 = await fetch(`/api/reports/performance${query2}`);
      const data2 = await res2.json();
      setPerformance(Array.isArray(data2) ? data2 : []);
    } catch (e) {
      console.error('Error loading reports', e);
    }
  };

  const initializeSystem = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะเริ่มต้นระบบ? การดำเนินการนี้จะสร้างข้อมูลเริ่มต้นในระบบ')) {
      return;
    }

    setInitializing(true);
    try {
      const token = await getValidToken();
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const response = await fetch('/api/adminb2b/init', {
        method: 'POST',
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
                  ระบบได้ถูกเริ่มต้นแล้ว คุณสามารถใช้งานได้ตามปกติ
                </p>
                <div className="space-x-3">
                  <Link
                    href="/adminb2b/products"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    จัดการสินค้า
                  </Link>
                  <Link
                    href="/adminb2b/customers"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    จัดการลูกค้า
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ลิงก์ด่วน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/adminb2b/products"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">จัดการสินค้า</div>
                <div className="text-sm text-gray-600">สร้าง แก้ไข และลบสินค้า</div>
              </Link>
              
              <Link
                href="/adminb2b/customers"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">จัดการลูกค้า</div>
                <div className="text-sm text-gray-600">จัดการข้อมูลลูกค้า B2B</div>
              </Link>

              <Link
                href="/adminb2b/quotations"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">ใบเสนอราคา</div>
                <div className="text-sm text-gray-600">สร้างและจัดการใบเสนอราคา</div>
              </Link>

              <Link
                href="/adminb2b/orders"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">จัดการออเดอร์</div>
                <div className="text-sm text-gray-600">ติดตามและจัดการออเดอร์</div>
              </Link>

              <Link
                href="/adminb2b/categories"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">หมวดหมู่สินค้า</div>
                <div className="text-sm text-gray-600">จัดการหมวดหมู่และประเภทสินค้า</div>
              </Link>

              <Link
                href="/adminb2b/settings"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="text-blue-600 font-medium">การตั้งค่า</div>
                <div className="text-sm text-gray-600">ตั้งค่าระบบและบัญชีผู้ใช้</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reports Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">รายงานและแดชบอร์ด</h2>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input className="border rounded px-3 py-2" placeholder="ทีม" value={team} onChange={(e) => setTeam(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="เจ้าของ (ownerId)" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
            <input className="border rounded px-3 py-2" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <input className="border rounded px-3 py-2" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={loadReports}>รีเฟรชรายงาน</button>
            <a className="ml-auto underline text-blue-700" href="/api/reports/export.csv" target="_blank" rel="noreferrer">Export CSV</a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded">
              <div className="px-4 py-2 border-b font-medium">มูลค่าดีลแยกตามสเตจ</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2">สเตจ</th>
                      <th className="p-2">จำนวนดีล</th>
                      <th className="p-2">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealsByStage.map((s: any) => (
                      <tr key={s._id} className="border-t">
                        <td className="p-2">{s.stageName || s._id}</td>
                        <td className="p-2">{s.count}</td>
                        <td className="p-2">฿{Number(s.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {dealsByStage.length === 0 && (
                      <tr><td className="p-4 text-center text-gray-500" colSpan={3}>ไม่มีข้อมูล</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border rounded">
              <div className="px-4 py-2 border-b font-medium">ผลงานรายเซลส์</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2">Owner</th>
                      <th className="p-2">ดีลชนะ (จำนวน)</th>
                      <th className="p-2">ดีลชนะ (มูลค่า)</th>
                      <th className="p-2">กิจกรรม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((r: any) => (
                      <tr key={r.ownerId} className="border-t">
                        <td className="p-2">{r.ownerId}</td>
                        <td className="p-2">{r.wonCount || 0}</td>
                        <td className="p-2">฿{Number(r.wonAmount || 0).toLocaleString()}</td>
                        <td className="p-2">{r.activityCount || 0}</td>
                      </tr>
                    ))}
                    {performance.length === 0 && (
                      <tr><td className="p-4 text-center text-gray-500" colSpan={4}>ไม่มีข้อมูล</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
