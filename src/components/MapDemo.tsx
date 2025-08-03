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
      <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        ทดสอบแผนที่ Interactive สำหรับ Lalamove
      </h1>
      
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
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          วิธีใช้งาน:
        </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• เลื่อนแผนที่เพื่อหาตำแหน่งที่ต้องการ</li>
              <li>• คลิกที่แผนที่เพื่อวางหมุด</li>
              <li>• ลากหมุดเพื่อปรับตำแหน่ง</li>
              <li>• สังเกตเส้นแดงตรงกลางแผนที่</li>
              <li>• กดปุ่มยืนยันเมื่อพอใจกับตำแหน่ง</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ฟีเจอร์ใหม่:
        </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            เลื่อนแผนที่ได้แบบ interactive
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ปักหมุดด้วยการคลิก
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ลากหมุดเพื่อปรับตำแหน่ง
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            แสดงพิกัดแบบ real-time
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            เอนิเมชันสวยงามเมื่อยืนยัน
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ลบปุ่ม GPS ออกแล้ว
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ใช้ OpenStreetMap (ไม่ต้อง API key)
          </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          เอนิเมชันพิเศษ:
        </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10M7 8L5 6m2 2l2-2m6 0l2 2m-2-2L13 6" />
            </svg>
            ปุ่มยืนยันแสดงเอฟเฟกต์ rainbow
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            หมุดแฟลชเมื่อยืนยันตำแหน่ง
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            แผนที่ zoom in/out อัตโนมัติ
          </li>
              <li className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Loading animation แบบ smooth
          </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;