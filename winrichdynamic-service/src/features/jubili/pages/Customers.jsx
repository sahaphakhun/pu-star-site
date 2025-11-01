"use client";

import { useState } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { Plus, Search, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import CustomerFormNew from '@/components/CustomerFormNew';

export default function Customers() {
  const { customers, deleteCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'pipeline'

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contacts?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // คำนวณสถิติ
  const stats = {
    total: customers.length,
    target: customers.filter(c => c.type === 'target').length,
    new: customers.filter(c => c.type === 'new').length,
    regular: customers.filter(c => c.type === 'regular').length,
    general: customers.filter(c => c.type === 'general').length,
  };

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

  const getRowColor = (index) => {
    const colors = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-orange-50', 'bg-pink-50', 'bg-cyan-50'];
    return colors[index % colors.length];
  };

  const getLeftBorderColor = (index) => {
    const colors = ['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-orange-500', 'border-l-pink-500', 'border-l-cyan-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'list'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ≡ รายการลูกค้า
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'pipeline'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ⚙ สายลูกค้า
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white shadow px-6 py-4">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">ลูกค้าทั้งหมด</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.target}</div>
            <div className="text-sm text-gray-600">ลูกค้าเป้าหมาย</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.new}</div>
            <div className="text-sm text-gray-600">ลูกค้าใหม่</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.regular}</div>
            <div className="text-sm text-gray-600">ลูกค้าประจำ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">{stats.general}</div>
            <div className="text-sm text-gray-600">ลูกค้าทั่วไป</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4 text-sm text-blue-600 mb-4">
          <a href="#" className="hover:underline">ลูกค้าที่ติดต่อกับเรา ({stats.total})</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">ลูกค้าที่ไม่ติดต่อกับเรา (0)</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">ลูกค้าทั้งหมด ({stats.total})</a>
        </div>

        {/* Filter Buttons and Search */}
        <div className="flex gap-3 items-center">
          <button className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200">
            ทีม - กำหนดเอง
          </button>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200">
            ผู้รับผิดชอบ - กำหนดเอง
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">
            คำลูกค้า - กำหนดเอง
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก ชื่อลูกค้า ชื่อผู้ติดต่อ หรือ เลขประจำตัวผู้เสียภาษี"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
            ค้นหาเพิ่มเติม
          </button>
          
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้าง
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-b-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">รหัสลูกค้าอ้างอิง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อผู้ติดต่อ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ความสำคัญ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">กิจกรรมล่าสุด</th>
                <th className="px-4 py-3 text-left text-sm font-medium">แท็กกิจกรรมล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={`border-b border-l-4 ${getLeftBorderColor(index)} ${getRowColor(index)} hover:bg-gray-100 cursor-pointer`}
                  onClick={() => {
                    setEditingCustomer(customer);
                    setShowForm(true);
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded bg-blue-500"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.industry || 'ไม่ระบุประเภทธุรกิจ'}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.tags?.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 text-xs rounded ${
                            i === 0 ? 'bg-cyan-500 text-white' :
                            i === 1 ? 'bg-green-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {customer.tags?.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-300 text-gray-700">
                          +{customer.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.referenceCode || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {customer.contacts && customer.contacts.length > 0 ? (
                      <div>
                        <div className="font-medium text-gray-900">{customer.contacts[0].name}</div>
                        <div className="text-sm text-gray-600">โทร : {customer.contacts[0].phone}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {renderStars(customer.importance || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{customer.owner || 'ไม่ระบุ'}</div>
                    <div className="text-sm text-gray-600">{customer.team || 'Trade Sales Team'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {customer.lastActivity && (
                      <div className="text-sm text-gray-600">{customer.lastActivity}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">ติดต่อลูกค้า</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerFormNew
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
}
