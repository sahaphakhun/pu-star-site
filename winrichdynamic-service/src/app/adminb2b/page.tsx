'use client'

import React, { useEffect } from 'react'

const AdminB2BDashboard: React.FC = () => {
  useEffect(() => {
    // Redirect ไปหน้า dashboard
    location.href = '/adminb2b/dashboard';
  }, []);

  // แสดง loading ขณะ redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังเปลี่ยนหน้า...</p>
      </div>
    </div>
  );









}

export default AdminB2BDashboard


