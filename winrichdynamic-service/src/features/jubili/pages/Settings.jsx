"use client";

import React, { useState, useEffect } from 'react';
import useApiService from '@/features/jubili/hooks/useApiService';
import { Building2, Info, Construction, Trophy, Users, Settings as SettingsIcon, Bell, Award, User, ClipboardList, Store, UserCheck, Megaphone, Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
  const [activeMenu, setActiveMenu] = useState('company');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const {
    settings: { getSettings, updateSettings },
  } = useApiService();

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

  // Fetch settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSettings();
        setSettings(data);
        setFormData(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('ไม่สามารถดึงข้อมูลการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [getSettings]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle nested object changes (for bankInfo)
  const handleBankInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankInfo: {
        ...prev.bankInfo,
        [field]: value
      }
    }));
  };

  // Handle sales policy changes
  const handleSalesPolicyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      salesPolicy: {
        ...prev.salesPolicy,
        [field]: value
      }
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const updatedSettings = await updateSettings(formData);
      setSettings(updatedSettings);
      setSuccessMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    setFormData(settings);
    setEditMode(false);
    setError(null);
  };

  // Convert API data to display format
  const getDisplayData = () => {
    if (!settings) return null;
    
    return {
      company: {
        name: settings.companyName || 'บริษัท วินริช ไดนามิค จำกัด',
        logo: settings.companyName?.replace('บริษัท ', '').replace(' จำกัด', '').toUpperCase() || 'WINRICH DYNAMIC',
        address: settings.companyAddress || '',
        mainAddress: settings.companyAddress || '',
        taxId: settings.taxId || '',
        phone: settings.companyPhone || '',
        email: settings.companyEmail || '',
        bankInfo: settings.bankInfo || {
          bankName: '',
          accountName: '',
          accountNumber: '',
          branch: ''
        }
      },
      features: {
        geoFence: true,
        autoSuggestProducts: true,
        checkInWithLocation: true
      },
      salesPolicy: settings.salesPolicy || {
        approvalAmountThreshold: 1000000,
        maxDiscountPercentWithoutApproval: 10,
        tieredDiscounts: []
      }
    };
  };

  const displayData = getDisplayData();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

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
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {activeMenu === 'company' ? (
          <div className="max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Info className="text-blue-500" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">ข้อมูลกิจการ</h1>
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          บันทึก
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                      <X size={18} />
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Edit size={18} />
                    แก้ไข
                  </button>
                )}
              </div>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl font-bold px-8 py-4 rounded-lg">
                  {displayData?.company?.logo}
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
                {editMode ? (
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-800 font-medium">{displayData?.company?.name}</div>
                )}
              </div>

              {/* ที่อยู่ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[1]}`}>
                  ที่อยู่
                </div>
                {editMode ? (
                  <textarea
                    name="companyAddress"
                    value={formData.companyAddress || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-600">{displayData?.company?.address || '-'}</div>
                )}
              </div>

              {/* ที่อยู่หลัก */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[2]}`}>
                  ที่อยู่หลัก (สำนักงานใหญ่)
                </div>
                <div className="text-gray-800">{displayData?.company?.mainAddress}</div>
              </div>

              {/* เลขประจำตัวผู้เสียภาษี */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[3]}`}>
                  เลขประจำตัวผู้เสียภาษี
                </div>
                {editMode ? (
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                ) : (
                  <div className="text-gray-800 font-mono">{displayData?.company?.taxId}</div>
                )}
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[2]}`}>
                  เบอร์โทรศัพท์
                </div>
                {editMode ? (
                  <input
                    type="text"
                    name="companyPhone"
                    value={formData.companyPhone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                ) : (
                  <div className="text-gray-800 font-mono">{displayData?.company?.phone}</div>
                )}
              </div>

              {/* อีเมล */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[5]}`}>
                  อีเมล
                </div>
                {editMode ? (
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-800">{displayData?.company?.email}</div>
                )}
              </div>

              {/* เว็บไซต์ */}
              <div>
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[4]}`}>
                  เว็บไซต์
                </div>
                {editMode ? (
                  <input
                    type="text"
                    name="companyWebsite"
                    value={formData.companyWebsite || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-800">{settings?.companyWebsite || '-'}</div>
                )}
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="text-gray-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">ข้อมูลธนาคาร</h2>
              </div>
              <div className="space-y-4">
                {/* ชื่อธนาคาร */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[0]}`}>
                    ชื่อธนาคาร
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.bankInfo?.bankName || ''}
                      onChange={(e) => handleBankInfoChange('bankName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-800">{displayData?.company?.bankInfo?.bankName || '-'}</div>
                  )}
                </div>

                {/* ชื่อบัญชี */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[1]}`}>
                    ชื่อบัญชี
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.bankInfo?.accountName || ''}
                      onChange={(e) => handleBankInfoChange('accountName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-800">{displayData?.company?.bankInfo?.accountName || '-'}</div>
                  )}
                </div>

                {/* เลขที่บัญชี */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[2]}`}>
                    เลขที่บัญชี
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.bankInfo?.accountNumber || ''}
                      onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  ) : (
                    <div className="text-gray-800 font-mono">{displayData?.company?.bankInfo?.accountNumber || '-'}</div>
                  )}
                </div>

                {/* สาขา */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[3]}`}>
                    สาขา
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.bankInfo?.branch || ''}
                      onChange={(e) => handleBankInfoChange('branch', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-800">{displayData?.company?.bankInfo?.branch || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Policy */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="text-gray-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">นโยบายการขาย</h2>
              </div>
              <div className="space-y-4">
                {/* วงเงินที่ต้องขออนุมัติ */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[0]}`}>
                    วงเงินที่ต้องขออนุมัติ (บาท)
                  </div>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.salesPolicy?.approvalAmountThreshold || ''}
                      onChange={(e) => handleSalesPolicyChange('approvalAmountThreshold', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-800">{displayData?.salesPolicy?.approvalAmountThreshold?.toLocaleString() || '-'}</div>
                  )}
                </div>

                {/* ส่วนลดสูงสุดที่ไม่ต้องอนุมัติ */}
                <div>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold mb-2 ${labelColors[1]}`}>
                    ส่วนลดสูงสุดที่ไม่ต้องอนุมัติ (%)
                  </div>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.salesPolicy?.maxDiscountPercentWithoutApproval || ''}
                      onChange={(e) => handleSalesPolicyChange('maxDiscountPercentWithoutApproval', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-800">{displayData?.salesPolicy?.maxDiscountPercentWithoutApproval || '-'}</div>
                  )}
                </div>
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
                  <div className={`w-12 h-6 rounded-full transition-all ${displayData?.features?.checkInWithLocation ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${displayData?.features?.checkInWithLocation ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">เปิดใช้งาน GeoFence</span>
                  <div className={`w-12 h-6 rounded-full transition-all ${displayData?.features?.geoFence ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${displayData?.features?.geoFence ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">แนะนำรายการสินค้าอัตโนมัติ</span>
                  <div className={`w-12 h-6 rounded-full transition-all ${displayData?.features?.autoSuggestProducts ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${displayData?.features?.autoSuggestProducts ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
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
