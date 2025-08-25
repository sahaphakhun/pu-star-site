'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Settings {
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/logo');
      const data = await response.json();
      
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          logoUrl: data.logoUrl
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('ชนิดไฟล์ไม่รองรับ (รองรับ: PNG, JPEG, JPG, WebP, SVG)');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }

    setSelectedFile(file);
    
    // สร้าง preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({
          ...prev,
          logoUrl: data.logoUrl
        }));
        toast.success('อัพโหลดโลโก้สำเร็จ');
        setSelectedFile(null);
        setPreviewUrl('');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดโลโก้');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ตั้งค่าบริษัท</h1>

          {/* Logo Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">โลโก้บริษัท</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Logo */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">โลโก้ปัจจุบัน</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Company Logo"
                      className="max-w-full max-h-32 object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2">ไม่มีโลโก้</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload New Logo */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">อัพโหลดโลโก้ใหม่</h3>
                
                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ตัวอย่าง:</h4>
                    <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-24 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUploadLogo}
                  disabled={!selectedFile || uploading}
                  className={`w-full px-4 py-2 rounded-lg font-medium ${
                    !selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดโลโก้'}
                </button>

                {/* Instructions */}
                <div className="mt-4 text-sm text-gray-600">
                  <p>• รองรับไฟล์: PNG, JPEG, JPG, WebP, SVG</p>
                  <p>• ขนาดไฟล์สูงสุด: 5MB</p>
                  <p>• แนะนำขนาด: 300x300 pixels</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลบริษัท</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบริษัท
                </label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อบริษัท"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขประจำตัวผู้เสียภาษี
                </label>
                <input
                  type="text"
                  value={settings.taxId || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เลขประจำตัวผู้เสียภาษี"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่
                </label>
                <textarea
                  value={settings.companyAddress || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ที่อยู่บริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="อีเมล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เว็บไซต์
                </label>
                <input
                  type="url"
                  value={settings.companyWebsite || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เว็บไซต์"
                />
              </div>
            </div>
          </div>

          {/* Bank Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลบัญชีธนาคาร</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ธนาคาร
                </label>
                <input
                  type="text"
                  value={settings.bankInfo?.bankName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อธนาคาร"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  value={settings.bankInfo?.accountName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อบัญชี"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  value={settings.bankInfo?.accountNumber || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เลขที่บัญชี"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สาขา
                </label>
                <input
                  type="text"
                  value={settings.bankInfo?.branch || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="สาขา"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
