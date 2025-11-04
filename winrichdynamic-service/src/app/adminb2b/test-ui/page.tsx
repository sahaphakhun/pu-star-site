'use client';

import React from 'react';

export default function TestUIPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ทดสอบ UI แถบด้านข้าง</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          นี่คือหน้าทดสอบสำหรับตรวจสอบการแสดงผลของแถบด้านข้างที่ถูกปรับเปลี่ยน:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>แถบด้านข้างมีความกว้างเพียง 64px (w-16)</li>
          <li>ไอคอนและตัวอักษรจัดเรียงในแนวตั้ง</li>
          <li>ตัวอักษรมีขนาดเล็กมาก (text-xs)</li>
          <li>ตัวอักษรอยู่ใต้ไอคอน</li>
        </ul>
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            คุณสามารถสลับหน้าต่างๆ เพื่อดูการทำงานของแถบด้านข้างในหน้าต่างๆ ได้
          </p>
        </div>
      </div>
    </div>
  );
}