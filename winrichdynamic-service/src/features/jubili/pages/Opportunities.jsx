"use client";

import React, { useState } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { Plus, Flame, ThumbsUp, Phone, User } from 'lucide-react';

const Opportunities = () => {
  const { opportunities } = useData();
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // สีสำหรับไอคอนและแถบ
  const iconShapes = ['●', '■', '▲', '◆'];
  const iconColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFC107', '#F44336'];
  const leftBarColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
  const columnBgColors = [
    '#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5', 
    '#E0F2F1', '#FFF9C4', '#FFEBEE', '#E1F5FE', '#F1F8E9',
    '#FBE9E7', '#EDE7F6', '#E0F7FA'
  ];

  // ฟังก์ชันแปลงสถานะ
  const getStatusInfo = (status) => {
    const statusMap = {
      'new': { label: 'ใหม่', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
      'contacted': { label: 'ติดต่อแล้ว', color: 'bg-yellow-100 text-yellow-800', icon: '📞' },
      'quotation_sent': { label: 'ส่งใบเสนอราคา', color: 'bg-purple-100 text-purple-800', icon: '📄' },
      'negotiating': { label: 'เจรจา', color: 'bg-orange-100 text-orange-800', icon: '💬' },
      'won': { label: 'ชนะ', color: 'bg-green-100 text-green-800', icon: '✅' },
      'lost': { label: 'แพ้', color: 'bg-red-100 text-red-800', icon: '❌' }
    };
    return statusMap[status] || statusMap['new'];
  };

  // คำนวณมูลค่ารวม
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

  // กรองข้อมูลตาม Tab
  const filteredOpportunities = activeTab === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.status === activeTab);

  // Pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOpportunities = filteredOpportunities.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      {/* Header with Total Value */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">โอกาส</h1>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-lg shadow-md">
            <div className="text-sm">มูลค่ารวม</div>
            <div className="text-2xl font-bold">
              THB {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md">
            <Plus size={20} />
            สร้างโอกาส
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด ({opportunities.length})
        </button>
        <button
          onClick={() => { setActiveTab('new'); setCurrentPage(1); }}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'new'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ใหม่
        </button>
        <button
          onClick={() => { setActiveTab('contacted'); setCurrentPage(1); }}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'contacted'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ติดต่อแล้ว
        </button>
        <button
          onClick={() => { setActiveTab('won'); setCurrentPage(1); }}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'won'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ชนะ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
          <div className="col-span-2">หมายเลข</div>
          <div className="col-span-2">ลูกค้า</div>
          <div className="col-span-2">ผู้ติดต่อ</div>
          <div className="col-span-1">ความสำคัญ</div>
          <div className="col-span-2">สินค้า</div>
          <div className="col-span-1">วันที่</div>
          <div className="col-span-1">มูลค่า</div>
          <div className="col-span-1">สถานะ</div>
        </div>

        {/* Table Body */}
        <div>
          {currentOpportunities.map((opp, index) => {
            const statusInfo = getStatusInfo(opp.status);
            const globalIndex = startIndex + index;
            
            return (
              <div
                key={opp.id}
                className="grid grid-cols-12 gap-4 p-4 border-l-4 hover:bg-gray-50 transition-all"
                style={{ borderLeftColor: leftBarColors[globalIndex % leftBarColors.length] }}
              >
                {/* หมายเลข */}
                <div className="col-span-2 flex items-center gap-2" style={{ backgroundColor: columnBgColors[0 % columnBgColors.length] }}>
                  <span style={{ color: iconColors[globalIndex % iconColors.length], fontSize: '20px' }}>
                    {iconShapes[globalIndex % iconShapes.length]}
                  </span>
                  <span className="font-semibold text-gray-800">{opp.code}</span>
                </div>

                {/* ลูกค้า */}
                <div className="col-span-2" style={{ backgroundColor: columnBgColors[1 % columnBgColors.length] }}>
                  <div className="font-semibold text-gray-800">{opp.customer}</div>
                </div>

                {/* ผู้ติดต่อ */}
                <div className="col-span-2" style={{ backgroundColor: columnBgColors[2 % columnBgColors.length] }}>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    <span>{opp.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} />
                    <span>{opp.phone}</span>
                  </div>
                </div>

                {/* ความสำคัญ */}
                <div className="col-span-1 flex items-center gap-1" style={{ backgroundColor: columnBgColors[3 % columnBgColors.length] }}>
                  {Array.from({ length: opp.importance }).map((_, i) => (
                    <Flame key={i} size={16} className="text-orange-500 fill-orange-500" />
                  ))}
                </div>

                {/* สินค้า */}
                <div className="col-span-2 text-sm" style={{ backgroundColor: columnBgColors[4 % columnBgColors.length] }}>
                  {opp.products.slice(0, 2).map((product, i) => (
                    <div key={i} className="text-gray-600 truncate">{product}</div>
                  ))}
                  {opp.products.length > 2 && (
                    <div className="text-gray-400">+{opp.products.length - 2} รายการ</div>
                  )}
                </div>

                {/* วันที่ */}
                <div className="col-span-1" style={{ backgroundColor: columnBgColors[5 % columnBgColors.length] }}>
                  {new Date(opp.date).toLocaleDateString('th-TH', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>

                {/* มูลค่า */}
                <div className="col-span-1 font-semibold text-green-600" style={{ backgroundColor: columnBgColors[6 % columnBgColors.length] }}>
                  {opp.value > 0 ? `฿${opp.value.toLocaleString()}` : '-'}
                </div>

                {/* สถานะ */}
                <div className="col-span-1 flex items-center gap-2" style={{ backgroundColor: columnBgColors[7 % columnBgColors.length] }}>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} flex items-center gap-1`}>
                    <span>{statusInfo.icon}</span>
                    {statusInfo.label}
                  </span>
                  {opp.likes > 0 && (
                    <div className="flex items-center gap-1 text-blue-500">
                      <ThumbsUp size={14} className="fill-blue-500" />
                      <span className="text-xs font-semibold">{opp.likes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Opportunities;
