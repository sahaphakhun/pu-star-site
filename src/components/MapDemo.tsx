'use client';

import React, { useState } from 'react';
import { DeliveryLocation } from '@/schemas/order';
import InteractiveMap from './InteractiveMap';

// Demo component สำหรับทดสอบ InteractiveMap
const MapDemo: React.FC = () => {
  const [location, setLocation] = useState<DeliveryLocation>({
    latitude: 13.7563,
    longitude: 100.5018,
    mapDescription: 'กรุงเทพมหานคร'
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center">🗺️ ทดสอบแผนที่ Interactive สำหรับ Lalamove</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Map */}
        <div>
          <h2 className="text-lg font-semibold mb-3">แผนที่</h2>
          <InteractiveMap
            location={location}
            onLocationChange={setLocation}
            height="400px"
          />
        </div>

        {/* Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3">ข้อมูลตำแหน่ง</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Latitude:</label>
              <p className="text-lg font-mono">{location.latitude.toFixed(6)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Longitude:</label>
              <p className="text-lg font-mono">{location.longitude.toFixed(6)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">คำอธิบาย:</label>
              <p className="text-sm">{location.mapDescription}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 วิธีใช้งาน:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• เลื่อนแผนที่เพื่อหาตำแหน่งที่ต้องการ</li>
              <li>• คลิกที่แผนที่เพื่อวางหมุด</li>
              <li>• ลากหมุดเพื่อปรับตำแหน่ง</li>
              <li>• สังเกตเส้นแดงตรงกลางแผนที่</li>
              <li>• กดปุ่มยืนยันเมื่อพอใจกับตำแหน่ง</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">🎯 ฟีเจอร์ใหม่:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ เลื่อนแผนที่ได้แบบ interactive</li>
              <li>✅ ปักหมุดด้วยการคลิก</li>
              <li>✅ ลากหมุดเพื่อปรับตำแหน่ง</li>
              <li>✅ แสดงพิกัดแบบ real-time</li>
              <li>✅ ใช้ OpenStreetMap (ไม่ต้อง API key)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;