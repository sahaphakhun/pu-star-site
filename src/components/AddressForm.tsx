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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ที่อยู่จัดส่ง
        </label>

        {/* ที่อยู่ที่บันทึกไว้ */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="text-sm font-medium text-gray-600">เลือกจากที่อยู่ที่บันทึกไว้:</div>
            <div className="space-y-2">
              {savedAddresses.map((address) => (
                <div
                  key={address._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAddressId === address._id && !useCustomAddress
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAddressSelection(address._id || '')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === address._id && !useCustomAddress}
                          onChange={() => handleAddressSelection(address._id || '')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">{address.label}</span>
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
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="radio"
              name="addressType"
              checked={useCustomAddress}
              onChange={handleUseCustomToggle}
              className="text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              กรอกที่อยู่ใหม่
            </label>
          </div>
          
          <div className="space-y-4">
            {/* 1. ชื่อ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1. ชื่อ</label>
              <input
                type="text"
                value={customAddress.name}
                onChange={(e) => handleCustomAddressChange('name', e.target.value)}
                onTouchStart={handleInputTouch}
                placeholder="ชื่อ-นามสกุล"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  useCustomAddress 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                style={{
                  // เพิ่ม CSS properties สำหรับมือถือ
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px', // ขนาดขั้นต่ำสำหรับ touch target
                }}
              />
            </div>

            {/* 2. เบอร์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={customAddress.phone}
                onChange={(e) => handleCustomAddressChange('phone', e.target.value)}
                onTouchStart={handleInputTouch}
                placeholder="เบอร์โทรศัพท์"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  useCustomAddress 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                style={{
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                }}
              />
            </div>

            {/* 3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customAddress.province}
                  onChange={(e) => handleCustomAddressChange('province', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="จังหวัด"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.district}
                  onChange={(e) => handleCustomAddressChange('district', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="เขต/อำเภอ"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.subDistrict}
                  onChange={(e) => handleCustomAddressChange('subDistrict', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="แขวง/ตำบล"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.postalCode}
                  onChange={(e) => handleCustomAddressChange('postalCode', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="รหัสไปรษณี"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
              </div>
            </div>

            {/* 4. บ้านเลขที่, ซอย, หมู่, ถนน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">4. บ้านเลขที่, ซอย, หมู่, ถนน</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customAddress.houseNumber}
                  onChange={(e) => handleCustomAddressChange('houseNumber', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="บ้านเลขที่"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.lane}
                  onChange={(e) => handleCustomAddressChange('lane', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="ซอย"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.moo}
                  onChange={(e) => handleCustomAddressChange('moo', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="หมู่"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
                  }}
                />
                <input
                  type="text"
                  value={customAddress.road}
                  onChange={(e) => handleCustomAddressChange('road', e.target.value)}
                  onTouchStart={handleInputTouch}
                  placeholder="ถนน"
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    useCustomAddress 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '44px',
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