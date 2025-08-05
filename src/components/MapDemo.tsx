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


        </div>
      </div>
    </div>
  );
};

export default MapDemo;