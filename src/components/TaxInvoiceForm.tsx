'use client';

import React, { useState, useEffect } from 'react';

interface TaxInvoiceInfo {
  companyName: string;
  taxId: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail: string;
}

interface TaxInvoiceFormProps {
  onTaxInvoiceChange: (taxInvoiceData: TaxInvoiceInfo | null) => void;
  className?: string;
  initialRequestTaxInvoice?: boolean;
}

const TaxInvoiceForm: React.FC<TaxInvoiceFormProps> = ({ 
  onTaxInvoiceChange, 
  className = '',
  initialRequestTaxInvoice = false
}) => {
  const [requestTaxInvoice, setRequestTaxInvoice] = useState(initialRequestTaxInvoice);
  const [savedTaxInfo, setSavedTaxInfo] = useState<TaxInvoiceInfo | null>(null);
  const [useCustomTaxInfo, setUseCustomTaxInfo] = useState(false);
  const [customTaxInfo, setCustomTaxInfo] = useState<TaxInvoiceInfo>({
    companyName: '',
    taxId: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: ''
  });
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลใบกำกับภาษีที่บันทึกไว้
  useEffect(() => {
    fetchSavedTaxInfo();
  }, []);

  // ตั้งค่าข้อมูลเริ่มต้น
  useEffect(() => {
    if (savedTaxInfo && !useCustomTaxInfo && requestTaxInvoice) {
      onTaxInvoiceChange(savedTaxInfo);
    } else if (useCustomTaxInfo && requestTaxInvoice) {
      onTaxInvoiceChange(customTaxInfo);
    } else if (!requestTaxInvoice) {
      onTaxInvoiceChange(null);
    }
  }, [savedTaxInfo, useCustomTaxInfo, customTaxInfo, requestTaxInvoice, onTaxInvoiceChange]);

  const fetchSavedTaxInfo = async () => {
    try {
      const response = await fetch('/api/profile/tax-invoice');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSavedTaxInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching saved tax invoice info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTaxInvoiceChange = (checked: boolean) => {
    setRequestTaxInvoice(checked);
    if (!checked) {
      onTaxInvoiceChange(null);
    } else if (savedTaxInfo && !useCustomTaxInfo) {
      onTaxInvoiceChange(savedTaxInfo);
    } else if (useCustomTaxInfo) {
      onTaxInvoiceChange(customTaxInfo);
    }
  };

  const handleUseSavedTaxInfo = () => {
    setUseCustomTaxInfo(false);
    if (savedTaxInfo) {
      // ตรวจสอบว่าข้อมูลที่บันทึกไว้มีอีเมลหรือไม่
      if (!savedTaxInfo.companyEmail) {
        // ถ้าไม่มีอีเมล ให้เปลี่ยนไปใช้ custom form เพื่อให้ผู้ใช้กรอกอีเมล
        setUseCustomTaxInfo(true);
        setCustomTaxInfo({
          ...savedTaxInfo,
          companyEmail: ''
        });
        return;
      }
      onTaxInvoiceChange(savedTaxInfo);
    }
  };

  const handleCustomTaxInfoChange = (field: keyof TaxInvoiceInfo, value: string) => {
    const newCustomTaxInfo = { ...customTaxInfo, [field]: value };
    setCustomTaxInfo(newCustomTaxInfo);
    setUseCustomTaxInfo(true);
    
    if (requestTaxInvoice) {
      onTaxInvoiceChange(newCustomTaxInfo);
    }
  };

  const handleUseCustomToggle = () => {
    const newUseCustom = !useCustomTaxInfo;
    setUseCustomTaxInfo(newUseCustom);
    
    if (!newUseCustom && savedTaxInfo) {
      onTaxInvoiceChange(savedTaxInfo);
    } else {
      onTaxInvoiceChange(customTaxInfo);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Checkbox สำหรับขอใบกำกับภาษี */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="requestTaxInvoice"
          checked={requestTaxInvoice}
          onChange={(e) => handleRequestTaxInvoiceChange(e.target.checked)}
          className="mt-1 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="requestTaxInvoice" className="text-sm font-medium text-gray-700">
            ขอใบกำกับภาษีเต็มรูปแบบ
          </label>
          <p className="text-xs text-gray-500 mt-1">
            เงื่อนไข: ไม่สามารถออกใบกำกับภาษีย้อนหลังจากวันที่สั่งซื้อได้ กรุณากรอกเลขประจำตัวผู้เสียภาษีให้ถูกต้องเพื่อความรวดเร็วในการออกใบกำกับฯ
          </p>
        </div>
      </div>

      {/* ฟอร์มข้อมูลใบกำกับภาษี */}
      {requestTaxInvoice && (
        <div className="space-y-4 border-l-4 border-blue-500 pl-4 ml-4">
          
          {/* ข้อมูลที่บันทึกไว้ */}
          {savedTaxInfo && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-medium text-gray-600">ใช้ข้อมูลที่บันทึกไว้:</div>
              <div
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  !useCustomTaxInfo
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={handleUseSavedTaxInfo}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="taxInfoType"
                    checked={!useCustomTaxInfo}
                    onChange={handleUseSavedTaxInfo}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{savedTaxInfo.companyName}</div>
                    <div className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี: {savedTaxInfo.taxId}</div>
                    {savedTaxInfo.companyAddress && (
                      <div className="text-sm text-gray-600">{savedTaxInfo.companyAddress}</div>
                    )}
                    {savedTaxInfo.companyEmail && (
                      <div className="text-sm text-gray-600">อีเมล: {savedTaxInfo.companyEmail}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ตัวเลือกกรอกข้อมูลใหม่ */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="taxInfoType"
                checked={useCustomTaxInfo}
                onChange={handleUseCustomToggle}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                กรอกข้อมูลใหม่
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อบริษัท/นิติบุคคล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTaxInfo.companyName}
                  onChange={(e) => handleCustomTaxInfoChange('companyName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    useCustomTaxInfo 
                      ? 'border-blue-500 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="บริษัท ABC จำกัด"
                  disabled={!useCustomTaxInfo}
                  required={requestTaxInvoice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTaxInfo.taxId}
                  onChange={(e) => handleCustomTaxInfoChange('taxId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    useCustomTaxInfo 
                      ? 'border-blue-500 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="0000000000000"
                  disabled={!useCustomTaxInfo}
                  required={requestTaxInvoice}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่สำหรับออกใบกำกับภาษี</label>
                <textarea
                  value={customTaxInfo.companyAddress}
                  onChange={(e) => handleCustomTaxInfoChange('companyAddress', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    useCustomTaxInfo 
                      ? 'border-blue-500 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="ที่อยู่ตามใบกำกับภาษี"
                  disabled={!useCustomTaxInfo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรติดต่อ</label>
                <input
                  type="tel"
                  value={customTaxInfo.companyPhone}
                  onChange={(e) => handleCustomTaxInfoChange('companyPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    useCustomTaxInfo 
                      ? 'border-blue-500 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="02-000-0000"
                  disabled={!useCustomTaxInfo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={customTaxInfo.companyEmail}
                  onChange={(e) => handleCustomTaxInfoChange('companyEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    useCustomTaxInfo 
                      ? 'border-blue-500 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="company@example.com"
                  disabled={!useCustomTaxInfo}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoiceForm; 