'use client';

import React, { useState, useEffect } from 'react';

// Legacy address format
interface LegacyAddress {
  _id?: string;
  label: string;
  address: string; // Old format - single string
  isDefault: boolean;
}

// New address format
interface Address {
  _id?: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  houseNumber: string;
  lane: string;
  moo: string;
  road: string;
  isDefault: boolean;
}

// Combined type for backward compatibility
type AddressData = LegacyAddress | Address;

interface AddressFormProps {
  onAddressChange: (address: Address) => void;
  initialAddress?: Address;
  className?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  onAddressChange, 
  initialAddress = {
    label: '',
    name: '',
    phone: '',
    province: '',
    district: '',
    subDistrict: '',
    postalCode: '',
    houseNumber: '',
    lane: '',
    moo: '',
    road: '',
    isDefault: false
  }, 
  className = '' 
}) => {
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<Address>(initialAddress);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [loading, setLoading] = useState(true);

  // เพิ่ม CSS สำหรับ mobile optimization
  useEffect(() => {
    // เพิ่ม CSS สำหรับ mobile input optimization
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        input[type="text"], input[type="tel"] {
          font-size: 16px !important; /* ป้องกัน zoom บน iOS */
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        input[type="text"]:focus, input[type="tel"]:focus {
          transform: scale(1.02);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* ปรับปรุง touch targets */
        label {
          min-height: 44px;
          display: flex;
          align-items: center;
        }
        
        /* ปรับปรุง radio buttons */
        input[type="radio"] {
          min-width: 20px;
          min-height: 20px;
        }
        
        /* ปรับปรุง grid layout สำหรับมือถือ */
        .mobile-grid {
          grid-template-columns: 1fr !important;
        }
        
        /* เพิ่ม spacing สำหรับมือถือ */
        .mobile-spacing {
          gap: 1rem !important;
        }
        
        /* ปรับปรุง input fields สำหรับมือถือ */
        .mobile-input {
          min-height: 48px !important;
          padding: 0.75rem !important;
          font-size: 16px !important;
        }
        
        /* เพิ่ม touch feedback */
        .mobile-input:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }
        
        /* ปรับปรุง focus states */
        .mobile-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* ปรับปรุง placeholder text */
        .mobile-input::placeholder {
          color: #9ca3af;
          opacity: 1;
        }
        
        /* ปรับปรุง radio button labels */
        input[type="radio"] + label {
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }
        
        /* เพิ่ม visual feedback สำหรับ touch */
        .touch-feedback {
          -webkit-tap-highlight-color: rgba(59, 130, 246, 0.2);
          transition: all 0.2s ease;
        }
        
        .touch-feedback:active {
          background-color: rgba(59, 130, 246, 0.1);
          transform: scale(0.98);
        }
        
        /* ปรับปรุง form layout สำหรับมือถือ */
        .mobile-form {
          padding: 1rem !important;
        }
        
        /* ปรับปรุง spacing สำหรับมือถือ */
        .mobile-form > div {
          margin-bottom: 1.5rem !important;
        }
        
        /* ปรับปรุง input groups */
        .mobile-input-group {
          margin-bottom: 1rem !important;
        }
        
        /* เพิ่ม visual hierarchy */
        .mobile-section-title {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          margin-bottom: 0.75rem !important;
          color: #1f2937 !important;
        }
        
        /* ปรับปรุง radio button groups */
        .mobile-radio-group {
          padding: 0.5rem 0 !important;
        }
        
        /* เพิ่ม hover effects สำหรับ desktop */
        @media (hover: hover) {
          .mobile-input:hover {
            border-color: #d1d5db;
            background-color: #f9fafb;
          }
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ดึงที่อยู่ที่บันทึกไว้
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Helper functions for type checking and conversion
  const isLegacyAddress = (address: AddressData): address is LegacyAddress => {
    return 'address' in address && typeof address.address === 'string';
  };

  const parseAddressString = (legacyAddr: LegacyAddress): Address => {
    // แปลง address string เก่าเป็น format ใหม่
    return {
      _id: legacyAddr._id,
      label: legacyAddr.label,
      name: '',
      phone: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      houseNumber: legacyAddr.address, // วางที่อยู่เก่าไว้ในฟิลด์บ้านเลขที่ก่อน
      lane: '',
      moo: '',
      road: '',
      isDefault: legacyAddr.isDefault
    };
  };

  const formatAddressString = (address: Address): string => {
    // รวมข้อมูลที่อยู่เป็น string สำหรับแสดงผล
    const parts = [
      address.houseNumber,
      address.lane ? `ซ.${address.lane}` : '',
      address.moo ? `หมู่ ${address.moo}` : '',
      address.road ? `ถ.${address.road}` : '',
      address.subDistrict ? `ต.${address.subDistrict}` : '',
      address.district ? `อ.${address.district}` : '',
      address.province,
      address.postalCode
    ].filter(Boolean);
    return parts.join(' ');
  };

  // ตั้งค่าที่อยู่เริ่มต้น
  useEffect(() => {
    if (savedAddresses.length > 0 && !useCustomAddress) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      const targetAddress = defaultAddress || savedAddresses[0];
      if (targetAddress) {
        setSelectedAddressId(targetAddress._id || '');
        // Convert to new format if needed
        const addressToSend = isLegacyAddress(targetAddress) 
          ? parseAddressString(targetAddress)
          : targetAddress;
        onAddressChange(addressToSend);
      }
    }
  }, [savedAddresses, useCustomAddress, onAddressChange]);

  // อัปเดตที่อยู่เมื่อเปลี่ยนการเลือก
  useEffect(() => {
    if (useCustomAddress) {
      onAddressChange(customAddress);
    } else {
      const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);
      if (selectedAddress) {
        // Convert to new format if needed
        const addressToSend = isLegacyAddress(selectedAddress) 
          ? parseAddressString(selectedAddress)
          : selectedAddress;
        onAddressChange(addressToSend);
      }
    }
  }, [selectedAddressId, customAddress, useCustomAddress, savedAddresses, onAddressChange]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user.addresses) {
          setSavedAddresses(data.user.addresses);
        }
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseCustomAddress(false);
  };

  const handleCustomAddressChange = (field: keyof Address, value: string) => {
    const updatedAddress = { ...customAddress, [field]: value };
    setCustomAddress(updatedAddress);
    setUseCustomAddress(true);
    setSelectedAddressId('');
    onAddressChange(updatedAddress);
  };

  const handleUseCustomToggle = () => {
    const newUseCustom = !useCustomAddress;
    setUseCustomAddress(newUseCustom);
    
    if (!newUseCustom && savedAddresses.length > 0) {
      // กลับไปใช้ที่อยู่ที่บันทึกไว้
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddress._id || '');
      const addressToSend = isLegacyAddress(defaultAddress) 
        ? parseAddressString(defaultAddress)
        : defaultAddress;
      onAddressChange(addressToSend);
    } else {
      // ใช้ที่อยู่ที่กรอกเอง
      onAddressChange(customAddress);
    }
  };

  // เพิ่มฟังก์ชันสำหรับจัดการ touch events บนมือถือ
  const handleInputTouch = (e: React.TouchEvent<HTMLInputElement>) => {
    // เปิดใช้งาน input field เมื่อถูกแตะบนมือถือ
    if (!useCustomAddress) {
      setUseCustomAddress(true);
      setSelectedAddressId('');
    }
    
    // Focus input field
    e.currentTarget.focus();
    
    // เปิดแป้นพิมพ์บนมือถือ
    if (e.currentTarget.type === 'tel') {
      e.currentTarget.setAttribute('inputmode', 'numeric');
    } else if (e.currentTarget.type === 'text') {
      e.currentTarget.setAttribute('inputmode', 'text');
    }
    
    // ป้องกันการ scroll ที่ไม่ต้องการ
    e.preventDefault();
  };

  // เพิ่มฟังก์ชันสำหรับจัดการ click events บนมือถือ
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // เปิดใช้งาน input field เมื่อถูกคลิกบนมือถือ
    if (!useCustomAddress) {
      setUseCustomAddress(true);
      setSelectedAddressId('');
    }
    
    // Focus input field
    e.currentTarget.focus();
    
    // เปิดแป้นพิมพ์บนมือถือ
    if (e.currentTarget.type === 'tel') {
      e.currentTarget.setAttribute('inputmode', 'numeric');
    } else if (e.currentTarget.type === 'text') {
      e.currentTarget.setAttribute('inputmode', 'text');
    }
  };

  // เพิ่มฟังก์ชันสำหรับจัดการ focus events
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // เปิดใช้งาน input field เมื่อถูก focus
    if (!useCustomAddress) {
      setUseCustomAddress(true);
      setSelectedAddressId('');
    }
    
    // เปิดแป้นพิมพ์บนมือถือ
    if (e.currentTarget.type === 'tel') {
      e.currentTarget.setAttribute('inputmode', 'numeric');
    } else if (e.currentTarget.type === 'text') {
      e.currentTarget.setAttribute('inputmode', 'text');
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
    <div className={`space-y-4 ${className} mobile-form`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mobile-section-title">
          ที่อยู่จัดส่ง
        </label>

        {/* ที่อยู่ที่บันทึกไว้ */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3 mb-4 mobile-input-group">
            <div className="text-sm font-medium text-gray-600">เลือกจากที่อยู่ที่บันทึกไว้:</div>
            <div className="space-y-2">
              {savedAddresses.map((address) => (
                <div
                  key={address._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors touch-feedback ${
                    selectedAddressId === address._id && !useCustomAddress
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAddressSelection(address._id || '')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mobile-radio-group">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === address._id && !useCustomAddress}
                          onChange={() => handleAddressSelection(address._id || '')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900 touch-feedback">{address.label}</span>
                        {address.isDefault && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            ค่าเริ่มต้น
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-6">
                        {isLegacyAddress(address) ? address.address : formatAddressString(address)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ตัวเลือกกรอกที่อยู่ใหม่ */}
        <div className="border-t pt-4 mobile-input-group">
          <div className="flex items-center space-x-2 mb-3 mobile-radio-group">
            <input
              type="radio"
              id="customAddress"
              name="addressType"
              checked={useCustomAddress}
              onChange={handleUseCustomToggle}
              className="text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="customAddress" className="text-sm font-medium text-gray-700 cursor-pointer touch-feedback">
              กรอกที่อยู่ใหม่
            </label>
          </div>
          
          <div className="space-y-4">
            {/* 1. ชื่อ */}
            <div className="mobile-input-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">1. ชื่อ</label>
              <input
                type="text"
                value={customAddress.name}
                onChange={(e) => handleCustomAddressChange('name', e.target.value)}
                onTouchStart={handleInputTouch}
                onClick={handleInputClick}
                onFocus={handleInputFocus}
                placeholder="ชื่อ-นามสกุล"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                  useCustomAddress 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
                style={{
                  // เพิ่ม CSS properties สำหรับมือถือ
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px', // ขนาดขั้นต่ำสำหรับ touch target
                  cursor: 'text',
                }}
              />
            </div>

            {/* 2. เบอร์ */}
            <div className="mobile-input-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">2. เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={customAddress.phone}
                onChange={(e) => handleCustomAddressChange('phone', e.target.value)}
                onTouchStart={handleInputTouch}
                onClick={handleInputClick}
                onFocus={handleInputFocus}
                placeholder="เบอร์โทรศัพท์"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                  useCustomAddress 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
                style={{
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                  cursor: 'text',
                }}
              />
            </div>

            {/* 3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี */}
            <div className="mobile-input-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mobile-grid mobile-spacing">
                <input
                  type="text"
                  value={customAddress.province}
                  onChange={(e) => handleCustomAddressChange('province', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="จังหวัด"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.district}
                  onChange={(e) => handleCustomAddressChange('district', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="เขต/อำเภอ"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.subDistrict}
                  onChange={(e) => handleCustomAddressChange('subDistrict', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="แขวง/ตำบล"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.postalCode}
                  onChange={(e) => handleCustomAddressChange('postalCode', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="รหัสไปรษณี"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
              </div>
            </div>

            {/* 4. บ้านเลขที่, ซอย, หมู่, ถนน */}
            <div className="mobile-input-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">4. บ้านเลขที่, ซอย, หมู่, ถนน</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mobile-grid mobile-spacing">
                <input
                  type="text"
                  value={customAddress.houseNumber}
                  onChange={(e) => handleCustomAddressChange('houseNumber', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="บ้านเลขที่"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.lane}
                  onChange={(e) => handleCustomAddressChange('lane', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="ซอย"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.moo}
                  onChange={(e) => handleCustomAddressChange('moo', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="หมู่"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.road}
                  onChange={(e) => handleCustomAddressChange('road', e.target.value)}
                  onTouchStart={handleInputTouch}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  placeholder="ถนน"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mobile-input ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                    cursor: 'text',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm; 