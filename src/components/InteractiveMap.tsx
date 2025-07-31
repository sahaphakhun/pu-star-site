'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeliveryLocation } from '@/schemas/order';

// เพิ่ม CSS animation สำหรับเอฟเฟกต์
const injectStyles = () => {
  if (typeof window !== 'undefined' && !document.querySelector('#map-animations')) {
    const style = document.createElement('style');
    style.id = 'map-animations';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      @keyframes rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .rainbow-bg {
        animation: rainbow 2s ease infinite;
      }
    `;
    document.head.appendChild(style);
  }
};

interface InteractiveMapProps {
  location: DeliveryLocation;
  onLocationChange: (location: DeliveryLocation) => void;
  height?: string;
}

// ฟังก์ชันสำหรับโหลด Leaflet แบบ dynamic
const loadLeaflet = async () => {
  try {
    if (typeof window === 'undefined') {
      return null; // ไม่สามารถใช้งานใน SSR
    }

    const L = await import('leaflet');
    
    // โหลด CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // แก้ไข icon path issue ที่เกิดจาก webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    return L;
  } catch (error) {
    console.error('Failed to load Leaflet:', error);
    return null;
  }
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  onLocationChange,
  height = '300px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState(location);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // เพิ่ม CSS animations
    injectStyles();

    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const L = await loadLeaflet();
        if (!L || !mounted) return;

        // สร้างแผนที่
        const map = L.map(mapRef.current).setView([currentLocation.latitude, currentLocation.longitude], 16);

        // เพิ่ม tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // เพิ่ม marker
        const marker = L.marker([currentLocation.latitude, currentLocation.longitude], {
          draggable: true
        }).addTo(map);

        // เมื่อ drag marker
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          const newLocation = {
            latitude: position.lat,
            longitude: position.lng,
            mapDescription: `ตำแหน่งที่เลือก: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
          };
          setCurrentLocation(newLocation);
          onLocationChange(newLocation);
        });

        // เมื่อคลิกที่แผนที่
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          const newLocation = {
            latitude: lat,
            longitude: lng,
            mapDescription: `ตำแหน่งที่เลือก: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          };
          setCurrentLocation(newLocation);
          onLocationChange(newLocation);
        });

        // เพิ่ม crosshair ตรงกลางแผนที่
        const crosshairIcon = L.divIcon({
          className: 'center-crosshair',
          html: '<div style="width: 2px; height: 20px; background: #ef4444; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div><div style="width: 20px; height: 2px; background: #ef4444; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const centerMarker = L.marker(map.getCenter(), {
          icon: crosshairIcon,
          interactive: false
        }).addTo(map);

        // อัปเดตตำแหน่งเมื่อเลื่อนแผนที่
        let moveTimeout: NodeJS.Timeout;
        map.on('moveend', () => {
          const center = map.getCenter();
          centerMarker.setLatLng(center);
          
          clearTimeout(moveTimeout);
          moveTimeout = setTimeout(() => {
            const newLocation = {
              latitude: center.lat,
              longitude: center.lng,
              mapDescription: `ตำแหน่งจากแผนที่: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
            };
            setCurrentLocation(newLocation);
          }, 300);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setIsLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('ไม่สามารถโหลดแผนที่ได้');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // อัปเดตตำแหน่งเมื่อ location prop เปลี่ยน
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = [location.latitude, location.longitude];
      mapInstanceRef.current.setView(newLatLng, 16);
      markerRef.current.setLatLng(newLatLng);
      setCurrentLocation(location);
    }
  }, [location.latitude, location.longitude]);

  const confirmLocation = async () => {
    setIsConfirming(true);
    
    // เอฟเฟกต์บนแผนที่: zoom in เล็กน้อย และ flash marker
    if (mapInstanceRef.current && markerRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(currentZoom + 1, { animate: true });
      
      // เอฟเฟกต์ bounce marker
      const marker = markerRef.current;
      const originalIcon = marker.getIcon();
      
      // สร้าง icon พิเศษสำหรับเอฟเฟกต์
      const L = await loadLeaflet();
      if (L) {
        const flashIcon = L.divIcon({
          className: 'flash-marker',
          html: '<div style="width: 30px; height: 30px; background: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8); animation: pulse 0.6s ease-in-out;"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        marker.setIcon(flashIcon);
        
        // กลับไปใช้ icon เดิมหลัง 600ms
        setTimeout(() => {
          marker.setIcon(originalIcon);
          mapInstanceRef.current.setZoom(currentZoom, { animate: true });
        }, 600);
      }
    }
    
    // เอนิเมชันแวบ 1.2 วินาที
    setTimeout(() => {
      onLocationChange({
        ...currentLocation,
        mapDescription: `✅ ยืนยันตำแหน่ง: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
      });
      
      // เอฟเฟกต์แสดงความสำเร็จ
      setTimeout(() => {
        setIsConfirming(false);
      }, 400);
    }, 1200);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ {error}</p>
        <p className="text-sm text-red-600 mt-1">กรุณาใช้การกรอกพิกัดด้วยมือแทน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div 
          ref={mapRef} 
          style={{ height }} 
          className="w-full rounded-lg border border-gray-300 bg-gray-100"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">กำลังโหลดแผนที่...</p>
              </div>
            </div>
          )}
        </div>
        
        {!isLoading && (
          <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-lg shadow-md">
            <p className="text-xs text-gray-600 font-medium">
              📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">💡 วิธีใช้งาน:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• เลื่อนแผนที่เพื่อหาตำแหน่งที่ต้องการ</li>
          <li>• คลิกที่แผนที่เพื่อวางหมุด</li>
          <li>• ลากหมุดเพื่อปรับตำแหน่ง</li>
          <li>• กดปุ่มยืนยันเมื่อพอใจกับตำแหน่ง</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={confirmLocation}
        disabled={isConfirming}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 ${
          isConfirming 
            ? 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-[length:200%_200%] rainbow-bg animate-pulse text-white cursor-not-allowed shadow-lg' 
            : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 hover:shadow-lg text-white transform transition-transform'
        }`}
      >
        {isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            🎯 กำลังยืนยันตำแหน่ง...
          </span>
        ) : (
          '✅ ยืนยันตำแหน่งนี้'
        )}
      </button>
    </div>
  );
};

export default InteractiveMap;