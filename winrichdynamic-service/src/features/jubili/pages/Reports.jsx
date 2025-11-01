"use client";

import React, { useState } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { FileText, Database, FolderOpen } from 'lucide-react';

const Reports = () => {
  const { reports } = useData();
  const [activeTab, setActiveTab] = useState('reports');

  // สีสำหรับเส้นขอบและไอคอน
  const borderColors = ['#4CAF50', '#E91E63', '#9C27B0', '#FF9800', '#F44336', '#2196F3'];
  const iconColors = [
    ['#4CAF50', '#E91E63', '#9C27B0'],
    ['#FF9800', '#4CAF50', '#F44336'],
    ['#2196F3', '#F44336', '#4CAF50'],
    ['#9C27B0', '#FF9800', '#E91E63'],
    ['#4CAF50', '#E91E63', '#9C27B0'],
    ['#FF9800', '#4CAF50', '#F44336'],
    ['#2196F3', '#F44336', '#4CAF50'],
    ['#9C27B0', '#FF9800', '#E91E63'],
    ['#4CAF50', '#E91E63', '#9C27B0'],
    ['#FF9800', '#4CAF50', '#F44336']
  ];

  const handleReportClick = (report) => {
    alert(`รายงาน ${report.code}: ${report.name}\n\nฟีเจอร์นี้กำลังพัฒนา...`);
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'reports'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText size={20} />
          รายงาน
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'custom'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Database size={20} />
          ของมูลเฉพาะพื้น
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'storage'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FolderOpen size={20} />
          คลังข้อมูล
        </button>
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            <div className="col-span-3">ชื่อรายงาน</div>
            <div className="col-span-7">คำอธิบาย</div>
            <div className="col-span-2">เข้าดูล่าสุด</div>
          </div>

          {/* Table Body */}
          <div>
            {reports.map((report, index) => (
              <div
                key={index}
                onClick={() => handleReportClick(report)}
                className="grid grid-cols-12 gap-4 p-4 border-l-4 hover:bg-gray-50 cursor-pointer transition-all relative"
                style={{ borderLeftColor: borderColors[index % borderColors.length] }}
              >
                {/* ชื่อรายงาน */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded text-sm">
                    {report.code}
                  </div>
                  <span className="font-semibold text-gray-800">{report.name}</span>
                </div>

                {/* คำอธิบาย */}
                <div className="col-span-7 text-gray-600">
                  {report.description}
                </div>

                {/* เข้าดูล่าสุด */}
                <div className="col-span-2 text-gray-600">
                  {report.lastGenerated}
                </div>

                {/* ไอคอนสีสัน */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {iconColors[index % iconColors.length].map((color, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ฟีเจอร์นี้กำลังพัฒนา
          </h2>
          <p className="text-gray-600">
            {activeTab === 'custom' ? 'ของมูลเฉพาะพื้น' : 'คลังข้อมูล'} จะเปิดให้ใช้งานเร็วๆ นี้
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
