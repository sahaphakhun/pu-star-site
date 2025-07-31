'use client';

import React, { useState, useEffect } from 'react';
import { DeliveryLocation } from '@/schemas/order';

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
    location || { latitude: 13.7563, longitude: 100.5018, mapDescription: '' }
  );

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            mapDescription: 'ตำแหน่งปัจจุบัน'
          };
          setMapLocation(newLocation);
          onLocationChange(newLocation);
        },
        (error) => {
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + error.message);
        }
      );
    } else {
      alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
    }
  };

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

  useEffect(() => {
    if (location) {
      setMapLocation(location);
    }
  }, [location]);

  return (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-3">📍 ปักหมุดตำแหน่งสำหรับ Lalamove</h4>
      
      {/* TODO: ในอนาคตสามารถเพิ่ม Google Maps integration ได้ที่นี่
          <div className="mb-4 h-64 bg-gray-200 rounded border">
            <GoogleMap />
          </div>
      */}
      
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
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          🎯 ใช้ตำแหน่งปัจจุบัน
        </button>
        <button
          type="button"
          onClick={handleManualInput}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          📝 กรอกพิกัดเอง
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        💡 เคล็ดลับ: คุณสามารถใช้ Google Maps เพื่อค้นหาพิกัดของสถานที่ที่ต้องการได้<br/>
        📱 บนมือถือ: เปิด Google Maps → กดค้างที่ตำแหน่ง → คัดลอกพิกัด<br/>
        💻 บนคอมพิวเตอร์: เปิด Google Maps → คลิกขวาที่ตำแหน่ง → คัดลอกพิกัด
      </div>
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
          🚚 เลือกช่องทางการส่ง
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
                📦 การส่งปกติ
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
                🏍️ Lalamove (ส่งด่วนกทม. - ปริมณฑล)
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