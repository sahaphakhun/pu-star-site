'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxId: string;
  quotationPrefix: string;
  quotationValidityDays: number;
  defaultVatRate: number;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };
  notificationSettings: {
    emailNotifications: boolean;
    lineNotifications: boolean;
    lineChannelSecret: string;
    lineChannelAccessToken: string;
  };
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    companyName: 'WinRich Dynamic Co., Ltd.',
    companyAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    companyPhone: '+66 2 123 4567',
    companyEmail: 'info@winrich.com',
    companyTaxId: '0123456789012',
    quotationPrefix: 'QT',
    quotationValidityDays: 30,
    defaultVatRate: 7,
    defaultPaymentTerms: 'ชำระเงินภายใน 30 วัน',
    defaultDeliveryTerms: 'จัดส่งภายใน 7 วันหลังจากยืนยันออเดอร์',
    emailSettings: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      fromEmail: 'noreply@winrich.com',
      fromName: 'WinRich Dynamic'
    },
    notificationSettings: {
      emailNotifications: true,
      lineNotifications: false,
      lineChannelSecret: '',
      lineChannelAccessToken: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'notifications'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/adminb2b/settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดการตั้งค่า');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/adminb2b/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = field.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const testEmailConnection = async () => {
    try {
      const loadingToast = toast.loading('กำลังทดสอบการเชื่อมต่ออีเมล...');
      
      const response = await fetch('/api/adminb2b/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.emailSettings)
      });
      
      const result = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('การเชื่อมต่ออีเมลสำเร็จ');
      } else {
        toast.error(result.error || 'การเชื่อมต่ออีเมลล้มเหลว');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('การเชื่อมต่ออีเมลล้มเหลว');
    }
  };

  const testLineConnection = async () => {
    try {
      const loadingToast = toast.loading('กำลังทดสอบการเชื่อมต่อ LINE...');
      
      const response = await fetch('/api/adminb2b/settings/test-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.notificationSettings)
      });
      
      const result = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('การเชื่อมต่อ LINE สำเร็จ');
      } else {
        toast.error(result.error || 'การเชื่อมต่อ LINE ล้มเหลว');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('การเชื่อมต่อ LINE ล้มเหลว');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">การตั้งค่าระบบ</h1>
        <p className="text-gray-600 mt-2">
          จัดการการตั้งค่าทั่วไปของระบบ B2B
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ข้อมูลบริษัท
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            การตั้งค่าอีเมล
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            การแจ้งเตือน
          </button>
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลบริษัท</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบริษัท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อบริษัท"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขประจำตัวผู้เสียภาษี
              </label>
              <input
                type="text"
                value={settings.companyTaxId}
                onChange={(e) => handleInputChange('companyTaxId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890123"
                maxLength={13}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+66 2 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่บริษัท
              </label>
              <textarea
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ที่อยู่บริษัท"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">การตั้งค่าใบเสนอราคา</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำนำหน้าเลขที่ใบเสนอราคา
              </label>
              <input
                type="text"
                value={settings.quotationPrefix}
                onChange={(e) => handleInputChange('quotationPrefix', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="QT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันหมดอายุใบเสนอราคา (วัน)
              </label>
              <input
                type="number"
                value={settings.quotationValidityDays}
                onChange={(e) => handleInputChange('quotationValidityDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อัตราภาษีมูลค่าเพิ่มเริ่มต้น (%)
              </label>
              <input
                type="number"
                value={settings.defaultVatRate}
                onChange={(e) => handleInputChange('defaultVatRate', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการชำระเงินเริ่มต้น
            </label>
            <input
              type="text"
              value={settings.defaultPaymentTerms}
              onChange={(e) => handleInputChange('defaultPaymentTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชำระเงินภายใน 30 วัน"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการส่งมอบเริ่มต้น
            </label>
            <textarea
              value={settings.defaultDeliveryTerms}
              onChange={(e) => handleInputChange('defaultDeliveryTerms', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="จัดส่งภายใน 7 วันหลังจากยืนยันออเดอร์"
            />
          </div>
        </motion.div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">การตั้งค่าอีเมล</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.emailSettings.smtpHost}
                onChange={(e) => handleInputChange('emailSettings.smtpHost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.emailSettings.smtpPort}
                onChange={(e) => handleInputChange('emailSettings.smtpPort', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.emailSettings.smtpUser}
                onChange={(e) => handleInputChange('emailSettings.smtpUser', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.emailSettings.smtpPass}
                onChange={(e) => handleInputChange('emailSettings.smtpPass', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="App Password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จากอีเมล
              </label>
              <input
                type="email"
                value={settings.emailSettings.fromEmail}
                onChange={(e) => handleInputChange('emailSettings.fromEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="noreply@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จากชื่อ
              </label>
              <input
                type="text"
                value={settings.emailSettings.fromName}
                onChange={(e) => handleInputChange('emailSettings.fromName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={testEmailConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ทดสอบการเชื่อมต่ออีเมล
            </button>
          </div>
        </motion.div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">การตั้งค่าการแจ้งเตือน</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">การแจ้งเตือนทางอีเมล</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.notificationSettings.emailNotifications}
                  onChange={(e) => handleInputChange('notificationSettings.emailNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                  เปิดใช้งานการแจ้งเตือนทางอีเมล
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">การแจ้งเตือนทาง LINE</h3>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="lineNotifications"
                  checked={settings.notificationSettings.lineNotifications}
                  onChange={(e) => handleInputChange('notificationSettings.lineNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="lineNotifications" className="ml-2 text-sm text-gray-700">
                  เปิดใช้งานการแจ้งเตือนทาง LINE
                </label>
              </div>

              {settings.notificationSettings.lineNotifications && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LINE Channel Secret
                    </label>
                    <input
                      type="password"
                      value={settings.notificationSettings.lineChannelSecret}
                      onChange={(e) => handleInputChange('notificationSettings.lineChannelSecret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Channel Secret"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LINE Channel Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.notificationSettings.lineChannelAccessToken}
                      onChange={(e) => handleInputChange('notificationSettings.lineChannelAccessToken', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Channel Access Token"
                    />
                  </div>
                </div>
              )}

              {settings.notificationSettings.lineNotifications && (
                <div className="mt-4">
                  <button
                    onClick={testLineConnection}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    ทดสอบการเชื่อมต่อ LINE
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
