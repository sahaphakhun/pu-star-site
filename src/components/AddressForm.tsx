'use client';

import React, { useState, useEffect } from 'react';

interface Address {
  _id?: string;
  label: string;
  address: string;
  isDefault: boolean;
}

interface AddressFormProps {
  onAddressChange: (address: string) => void;
  initialAddress?: string;
  className?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  onAddressChange, 
  initialAddress = '', 
  className = '' 
}) => {
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState(initialAddress);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [loading, setLoading] = useState(true);

  // ดึงที่อยู่ที่บันทึกไว้
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // ตั้งค่าที่อยู่เริ่มต้น
  useEffect(() => {
    if (savedAddresses.length > 0 && !useCustomAddress) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id || '');
        onAddressChange(defaultAddress.address);
      } else if (savedAddresses.length > 0) {
        setSelectedAddressId(savedAddresses[0]._id || '');
        onAddressChange(savedAddresses[0].address);
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
        onAddressChange(selectedAddress.address);
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

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address);
    setUseCustomAddress(true);
    setSelectedAddressId('');
  };

  const handleUseCustomToggle = () => {
    const newUseCustom = !useCustomAddress;
    setUseCustomAddress(newUseCustom);
    
    if (!newUseCustom && savedAddresses.length > 0) {
      // กลับไปใช้ที่อยู่ที่บันทึกไว้
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddress._id || '');
      onAddressChange(defaultAddress.address);
    } else {
      // ใช้ที่อยู่ที่กรอกเอง
      onAddressChange(customAddress);
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
                      <p className="text-sm text-gray-600 mt-1 ml-6">{address.address}</p>
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
          
          <textarea
            value={customAddress}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder="กรอกที่อยู่จัดส่งครบถ้วน..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              useCustomAddress 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
            disabled={!useCustomAddress}
          />
        </div>


      </div>
    </div>
  );
};

export default AddressForm; 