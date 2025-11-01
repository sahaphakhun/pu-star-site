"use client";

import { useState } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { Plus, Search, Star, FileText, Activity } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Projects() {
  const { projects } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('กำหนด');

  const filteredProjects = projects.filter(project =>
    (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'กำหนด' || project.status === statusFilter)
  );

  // คำนวณมูลค่ารวม
  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);

  const renderStars = (importance) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < importance ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getRowColors = (index) => {
    const colorSets = [
      { border: 'border-l-red-500', bg: 'bg-red-50', icon: 'bg-red-400' },
      { border: 'border-l-purple-500', bg: 'bg-purple-50', icon: 'bg-purple-400' },
      { border: 'border-l-green-500', bg: 'bg-green-50', icon: 'bg-green-400' },
      { border: 'border-l-orange-500', bg: 'bg-orange-50', icon: 'bg-orange-400' },
      { border: 'border-l-blue-500', bg: 'bg-blue-50', icon: 'bg-blue-400' },
      { border: 'border-l-pink-500', bg: 'bg-pink-50', icon: 'bg-pink-400' },
    ];
    return colorSets[index % colorSets.length];
  };

  const getColumnBg = (colIndex) => {
    const colors = [
      'bg-gray-50',
      'bg-blue-50',
      'bg-green-50',
      'bg-yellow-50',
      'bg-pink-50',
      'bg-purple-50',
      'bg-cyan-50',
      'bg-orange-50',
      'bg-teal-50',
      'bg-indigo-50',
      'bg-red-50',
      'bg-lime-50',
    ];
    return colors[colIndex % colors.length];
  };

  const getRandomIcon = () => {
    const icons = [
      { color: 'bg-red-400', text: '●' },
      { color: 'bg-blue-400', text: '■' },
      { color: 'bg-green-400', text: '▲' },
      { color: 'bg-yellow-400', text: '◆' },
      { color: 'bg-purple-400', text: '●' },
      { color: 'bg-pink-400', text: '■' },
      { color: 'bg-cyan-400', text: '▲' },
      { color: 'bg-orange-400', text: '◆' },
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">โครงการ</h1>
          <div className="text-lg font-semibold text-gray-700">
            มูลค่ารวม <span className="text-blue-600">THB {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก หมายเลขโครงการ หรือ ชื่อโครงการ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="กำหนด">สถานะ - กำหนด</option>
            <option value="นำเสนอบริษัท">นำเสนอบริษัท</option>
            <option value="เสนอราคา">เสนอราคา</option>
            <option value="ทดสอบสินค้า">ทดสอบสินค้า/ส่งตัวอย่าง</option>
            <option value="อนุมัติราคา">อนุมัติราคา</option>
            <option value="ปิดใบเสนอราคา">ปิดใบเสนอราคา</option>
          </select>

          <button className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200">
            ค้นหาเพิ่มเติม
          </button>

          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <Plus className="h-4 w-4 mr-2" />
            สร้าง
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-3 py-3 text-center text-sm font-medium">ไอคอน</th>
                <th className="px-3 py-3 text-center text-sm font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">รหัสโครงการ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">โครงการ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ลูกค้า</th>
                <th className="px-3 py-3 text-center text-sm font-medium">ความสำคัญ</th>
                <th className="px-3 py-3 text-center text-sm font-medium">ใบเสนอราคา</th>
                <th className="px-3 py-3 text-center text-sm font-medium">กิจกรรม</th>
                <th className="px-4 py-3 text-left text-sm font-medium">วันเริ่มต้น-วันสิ้นสุด</th>
                <th className="px-4 py-3 text-right text-sm font-medium">มูลค่า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ผู้รับผิดชอบ</th>
                <th className="px-3 py-3 text-center text-sm font-medium">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const colors = getRowColors(index);
                const icon = getRandomIcon();
                
                return (
                  <tr
                    key={project.id}
                    className={`border-b border-l-4 ${colors.border} ${colors.bg} hover:bg-gray-100 cursor-pointer`}
                  >
                    {/* Icon */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(0)}`}>
                      <div className={`w-6 h-6 rounded-full ${icon.color} flex items-center justify-center text-white text-xs mx-auto`}>
                        {icon.text}
                      </div>
                    </td>

                    {/* Status */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(1)}`}>
                      <div className={`w-8 h-8 rounded ${colors.icon} flex items-center justify-center text-white font-bold mx-auto`}>
                        {project.stage || '1'}
                      </div>
                    </td>

                    {/* Code */}
                    <td className={`px-4 py-3 ${getColumnBg(2)}`}>
                      <div className="font-medium text-gray-900">{project.code || `PJ#${String(index + 1).padStart(6, '0')}`}</div>
                    </td>

                    {/* Project Name */}
                    <td className={`px-4 py-3 ${getColumnBg(3)}`}>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-600">{project.type || 'บ้าน / ทาวน์เฮาส์ / ที่พักอาศัยแนวราบ'}</div>
                    </td>

                    {/* Customer */}
                    <td className={`px-4 py-3 ${getColumnBg(4)}`}>
                      <div className="font-medium text-gray-900">{project.customer}</div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 text-xs rounded bg-red-500 text-white">
                          Project Sales
                        </span>
                      </div>
                    </td>

                    {/* Importance */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(5)}`}>
                      <div className="flex justify-center">
                        {renderStars(project.importance || 1)}
                      </div>
                    </td>

                    {/* Quotations */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(6)}`}>
                      <div className="font-medium text-gray-900">{project.quotationCount || 0}</div>
                    </td>

                    {/* Activities */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(7)}`}>
                      <div className="font-medium text-gray-900">{project.activityCount || 1}</div>
                    </td>

                    {/* Date Range */}
                    <td className={`px-4 py-3 ${getColumnBg(8)}`}>
                      <div className="text-sm text-gray-900">
                        {new Date(project.startDate || Date.now()).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-sm text-gray-900">
                        - {new Date(project.endDate || Date.now()).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Value */}
                    <td className={`px-4 py-3 text-right ${getColumnBg(9)}`}>
                      <div className="font-medium text-gray-900">
                        {(project.value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className={`px-4 py-3 ${getColumnBg(10)}`}>
                      <div className="font-medium text-gray-900">{project.owner || 'Saleprojects 1'}</div>
                    </td>

                    {/* Actions */}
                    <td className={`px-3 py-3 text-center ${getColumnBg(11)}`}>
                      <div className="flex gap-1 justify-center">
                        {[...Array(3)].map((_, i) => {
                          const actionIcon = getRandomIcon();
                          return (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded ${actionIcon.color} flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80`}
                            >
                              {actionIcon.text}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
