"use client";

import React, { useState } from 'react';
import { mockSettings } from '@/features/jubili/data/mockData';
import { Building2, Info, Construction, Trophy, Users, Settings as SettingsIcon, Bell, Award, User, ClipboardList, Store, UserCheck, Megaphone, Edit } from 'lucide-react';

const Settings = () => {
  const [activeMenu, setActiveMenu] = useState('company');
  const settings = mockSettings;

  // เมนู Sidebar
  const menuItems = [
    { id: 'company', label: 'ตั้งค่ากิจการ', icon: Building2, bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { id: 'info', label: 'ข้อมูลกิจการ', icon: Info, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'project', label: 'ตั้งค่าโครงการ', icon: Construction, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'goal', label: 'ตั้งค่าเป้าหมาย', icon: Trophy, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'employee', label: 'ตั้งค่าพนักงาน', icon: Users, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'system', label: 'ตั้งค่าระบบ', icon: SettingsIcon, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'notification', label: 'ตั้งค่าการแจ้งเตือน', icon: Bell, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'lost', label: 'ตั้งค่าหมุดผลการ lost', icon: Award, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'user', label: 'ตั้งค่าผู้ใช้งาน', icon: User, bgColor: 'bg-white', textColor: 'text-gray-700' },
    { id: 'approval', label: 'ตั้งค่าการอนุมัติ', icon: ClipboardList, bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
    { id: 'product', label: 'จัดการสินค้า', icon: Store, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { id: 'customer', label: 'จัดการลูกค้า', icon: UserCheck, bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { id: 'activity', label: 'จัดการกิจกรรม', icon: Megaphone, bgColor: 'bg-green-50', textColor: 'text-green-700' }
  ];

  // สีสำหรับ Label
  const labelColors = [
    'bg-blue-100 text-blue-800',
    'bg-red-100 text-red-800',
    'bg-green-100 text-green-800',
    'bg-indigo-100 text-indigo-800',
    'bg-orange-100 text-orange-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800'
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ตั้งค่า</h2>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-500 text-white font-semibold shadow-md'
                      : `${item.bgColor} ${item.textColor} hover:shadow-md`
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeMenu === 'company' ? (
          <div className="max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Info className="text-blue-500" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">ข้อมูลกิจการ</h1>
              </div>
              <button
                onClick={() => alert('ฟีเจอร์นี้กำลังพัฒนา')}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Edit size={18} />
                แก้ไข
              </button>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl font-bold px-8 py-4 rounded-lg">
                  {settings.company.logo}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {/* ชื่อกิจการ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[0]}`}>
                  ชื่อกิจการ
                </div>
                <div className="text-gray-800 font-medium">{settings.company.name}</div>
              </div>

              {/* ที่อยู่ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[1]}`}>
                  ที่อยู่
                </div>
                <div className="text-gray-600">{settings.company.address || '-'}</div>
              </div>

              {/* ที่อยู่หลัก */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[2]}`}>
                  ที่อยู่หลัก (สำนักงานใหญ่)
                </div>
                <div className="text-gray-800">{settings.company.mainAddress}</div>
              </div>

              {/* เลขประจำตัวผู้เสียภาษี */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[3]}`}>
                  เลขประจำตัวผู้เสียภาษี
                </div>
                <div className="text-gray-800 font-mono">{settings.company.taxId}</div>
              </div>

              {/* หมายเลข Promptpay */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[4]}`}>
                  หมายเลข Promptpay
                </div>
                <div className="text-gray-600">{settings.company.promptpayNumber || '-'}</div>
              </div>

              {/* ชื่อบัญชี Promptpay */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[5]}`}>
                  ชื่อบัญชี Promptpay
                </div>
                <div className="text-gray-600">{settings.company.promptpayName || '-'}</div>
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[2]}`}>
                  เบอร์โทรศัพท์
                </div>
                <div className="text-gray-800 font-mono">{settings.company.phone}</div>
              </div>

              {/* โทรศัพท์มือถือ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[6]}`}>
                  โทรศัพท์มือถือ
                </div>
                <div className="text-gray-600">{settings.company.mobile || '-'}</div>
              </div>

              {/* อีเมล */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[5]}`}>
                  อีเมล
                </div>
                <div className="text-gray-800">{settings.company.email}</div>
              </div>
            </div>

            {/* ตั้งค่าอื่นๆ */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="text-gray-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">ตั้งค่าอื่นๆ</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">เปิดใช้งานฟังก์ชั่นเช็คอินด้วยสถานที่</span>
                  <div className={`w-12 h-6 rounded-full transition-all ${settings.features.checkInWithLocation ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${settings.features.checkInWithLocation ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">เปิดใช้งาน GeoFence</span>
                  <div className={`w-12 h-6 rounded-full transition-all ${settings.features.geoFence ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${settings.features.geoFence ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">แนะนำรายการสินค้าอัตโนมัติ</span>
                  <div className={`w-12 h-6 rounded-full transition-all ${settings.features.autoSuggestProducts ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${settings.features.autoSuggestProducts ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // หมวดอื่นๆ แสดง Coming Soon
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
              <p className="text-gray-600">ฟีเจอร์นี้กำลังพัฒนา</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
