'use client';

import React, { useState, useEffect } from 'react';
import { DeliveryLocation } from '@/schemas/order';
import InteractiveMap from './InteractiveMap';

export type DeliveryMethod = 'standard' | 'lalamove';

interface DeliveryMethodSelectorProps {
  selectedMethod: DeliveryMethod;
  deliveryLocation?: DeliveryLocation;
  onMethodChange: (method: DeliveryMethod) => void;
  onLocationChange: (location: DeliveryLocation | undefined) => void;
  className?: string;
}

interface MapPickerProps {
  location?: DeliveryLocation;
  onLocationChange: (location: DeliveryLocation) => void;
}

// Component สำหรับเลือกตำแหน่งจากแผนที่
const MapPicker: React.FC<MapPickerProps> = ({ location, onLocationChange }) => {
  const [mapLocation, setMapLocation] = useState<DeliveryLocation>(
    location || { latitude: 13.7563, longitude: 100.5018, mapDescription: 'ตำแหน่งเริ่มต้น (กรุงเทพฯ)' }
  );
  const [showMap, setShowMap] = useState(false);



  const handleManualInput = () => {
    const lat = prompt('กรอกพิกัด Latitude:', mapLocation.latitude.toString());
    const lng = prompt('กรอกพิกัด Longitude:', mapLocation.longitude.toString());
    const desc = prompt('คำอธิบายตำแหน่ง (ไม่บังคับ):', mapLocation.mapDescription || '');
    
    if (lat && lng) {
      const newLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        mapDescription: desc || ''
      };
      setMapLocation(newLocation);
      onLocationChange(newLocation);
    }
  };

  const handleMapLocationChange = (newLocation: DeliveryLocation) => {
    setMapLocation(newLocation);
    onLocationChange(newLocation);
  };

  useEffect(() => {
    if (location) {
      setMapLocation(location);
    }
  }, [location]);

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ปักหมุดตำแหน่งสำหรับ Lalamove
        </h4>
      
      {/* แสดงตำแหน่งปัจจุบัน */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="text-sm text-gray-600">
          <strong>ตำแหน่งที่เลือก:</strong><br/>
          Latitude: {mapLocation.latitude.toFixed(6)}<br/>
          Longitude: {mapLocation.longitude.toFixed(6)}
          {mapLocation.mapDescription && (
            <>
              <br/>
              <strong>คำอธิบาย:</strong> {mapLocation.mapDescription}
            </>
          )}
        </div>
      </div>

      {/* ปุ่มสำหรับเลือกตำแหน่ง */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleManualInput}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            กรอกพิกัดเอง
          </button>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
                          {showMap ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ซ่อนแผนที่
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  เลื่อนแผนที่เพื่อปักหมุด
                </span>
              )}
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="mb-4">
          <InteractiveMap
            location={mapLocation}
            onLocationChange={handleMapLocationChange}
            height="400px"
          />
        </div>
      )}


    </div>
  );
};

const DeliveryMethodSelector: React.FC<DeliveryMethodSelectorProps> = ({
  selectedMethod,
  deliveryLocation,
  onMethodChange,
  onLocationChange,
  className = ''
}) => {
  const handleMethodChange = (method: DeliveryMethod) => {
    onMethodChange(method);
    
    // ถ้าเปลี่ยนจาก lalamove เป็น standard ให้ล้าง location
    if (method === 'standard') {
      onLocationChange(undefined);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            เลือกช่องทางการส่ง
        </label>
        
        <div className="space-y-3">
          {/* การส่งปกติ */}
          <div className="flex items-start">
            <input
              type="radio"
              id="delivery-standard"
              name="deliveryMethod"
              value="standard"
              checked={selectedMethod === 'standard'}
              onChange={(e) => handleMethodChange(e.target.value as DeliveryMethod)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-3">
              <label htmlFor="delivery-standard" className="block text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              การส่งปกติ
              </label>
              <p className="text-xs text-gray-500 mt-1">
                จัดส่งตามปกติผ่านบริษัทขนส่ง
              </p>
            </div>
          </div>

          {/* Lalamove */}
          <div className="flex items-start">
            <input
              type="radio"
              id="delivery-lalamove"
              name="deliveryMethod"
              value="lalamove"
              checked={selectedMethod === 'lalamove'}
              onChange={(e) => handleMethodChange(e.target.value as DeliveryMethod)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-3">
              <label htmlFor="delivery-lalamove" className="block text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Lalamove (ส่งด่วนกทม. - ปริมณฑล)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                ส่งด่วนภายในวัน เฉพาะกรุงเทพฯ และปริมณฑล
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* แสดง Map Picker เมื่อเลือก Lalamove */}
      {selectedMethod === 'lalamove' && (
        <MapPicker
          location={deliveryLocation}
          onLocationChange={onLocationChange}
        />
      )}
    </div>
  );
};

export default DeliveryMethodSelector;