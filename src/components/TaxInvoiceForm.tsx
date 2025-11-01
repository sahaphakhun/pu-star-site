'use client';

import React, { useState, useEffect } from 'react';

interface TaxInvoiceInfo {
  companyName: string;
  taxId: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail: string;
}

interface CompanyLookupData {
  companyName: string;
  taxId: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  registrationDate?: string;
  status?: string;
  businessType?: string;
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
  const [taxLookupId, setTaxLookupId] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

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

  const handleTaxLookup = async () => {
    if (!taxLookupId.trim()) {
      setLookupMessage('กรุณากรอกเลขประจำตัวผู้เสียภาษี');
      return;
    }

    // ตรวจสอบรูปแบบเลขประจำตัวผู้เสียภาษี
    if (!/^\d{13}$/.test(taxLookupId.trim())) {
      setLookupMessage('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
      return;
    }

    setIsLookingUp(true);
    setLookupMessage('');

    try {
      const response = await fetch(`/api/tax/lookup?taxId=${encodeURIComponent(taxLookupId.trim())}`);
      const result = await response.json();

      if (result.success && result.data) {
        // นำข้อมูลที่ได้มากรอกในฟอร์ม
        const newTaxInfo: TaxInvoiceInfo = {
          companyName: result.data.companyName,
          taxId: result.data.taxId,
          companyAddress: result.data.companyAddress,
          companyPhone: result.data.companyPhone,
          companyEmail: result.data.companyEmail || '' // อีเมลต้องให้ผู้ใช้กรอกเอง
        };
        
        setCustomTaxInfo(newTaxInfo);
        setUseCustomTaxInfo(true);
        
        // ถ้าขอใบกำกับภาษีอยู่แล้ว ให้อัปเดตข้อมูลทันที
        if (requestTaxInvoice) {
          onTaxInvoiceChange(newTaxInfo);
        }
        
        setLookupMessage('ดึงข้อมูลสำเร็จ! กรุณาตรวจสอบและกรอกอีเมลให้ครบถ้วน');
      } else {
        setLookupMessage(result.message || 'ไม่พบข้อมูลบริษัท');
      }
    } catch (error) {
      console.error('Tax lookup error:', error);
      setLookupMessage('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleTaxLookupIdChange = (value: string) => {
    setTaxLookupId(value);
    setLookupMessage('');
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
          
          {/* ระบบดึงข้อมูลอัตโนมัติ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">🔍 ดึงข้อมูลบริษัทอัตโนมัติ</h4>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={taxLookupId}
                  onChange={(e) => handleTaxLookupIdChange(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกเลขประจำตัวผู้เสียภาษี 13 หลัก"
                  maxLength={13}
                  disabled={isLookingUp}
                />
              </div>
              <button
                type="button"
                onClick={handleTaxLookup}
                disabled={isLookingUp || !taxLookupId.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isLookingUp ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                    🔍 ดึงข้อมูล
                  </>
                )}
              </button>
            </div>
            {lookupMessage && (
              <div className={`mt-2 text-sm ${
                lookupMessage.includes('สำเร็จ') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {lookupMessage}
              </div>
            )}
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>วิธีใช้:</strong> กรอกเลขประจำตัวผู้เสียภาษี 13 หลัก แล้วกดปุ่ม "ดึงข้อมูล" ระบบจะค้นหาข้อมูลจากกรมพัฒนาธุรกิจการค้าและกรอกให้อัตโนมัติ<br/>
              ⚠️ <strong>หมายเหตุ:</strong> การดึงข้อมูลอาจใช้เวลา 10-30 วินาที ขึ้นอยู่กับความเร็วของเซิร์ฟเวอร์ราชการ
            </p>
          </div>
          
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