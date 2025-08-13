"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ContactForm {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  new: 'ใหม่',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  closed: 'ปิด'
};

const categoryLabels = {
  sales: 'สอบถามข้อมูลสินค้า/บริการ',
  support: 'ขอรับการสนับสนุนทางเทคนิค',
  partnership: 'ติดต่อเรื่องความร่วมมือ/ตัวแทนจำหน่าย',
  complaint: 'แจ้งปัญหาการใช้งานสินค้า',
  other: 'อื่นๆ'
};

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchContactForms();
  }, []);

  const fetchContactForms = async () => {
    try {
      const response = await fetch('/api/admin/contact-forms');
      if (response.ok) {
        const data = await response.json();
        setContactForms(data.contactForms);
      }
    } catch (error) {
      console.error('Error fetching contact forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/contact-forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setContactForms(prev => 
          prev.map(form => 
            form._id === id ? { ...form, status } : form
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredForms = contactForms.filter(form => {
    if (filterStatus !== 'all' && form.status !== filterStatus) return false;
    if (filterCategory !== 'all' && form.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ข้อความติดต่อจากลูกค้า</h1>
        <p className="text-gray-600 mt-2">จัดการและตอบกลับข้อความติดต่อจากลูกค้า</p>
      </div>

      {/* ตัวกรอง */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">ทั้งหมด</option>
              <option value="new">ใหม่</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="closed">ปิด</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">ทั้งหมด</option>
              <option value="sales">สอบถามข้อมูลสินค้า/บริการ</option>
              <option value="support">ขอรับการสนับสนุนทางเทคนิค</option>
              <option value="partnership">ติดต่อเรื่องความร่วมมือ/ตัวแทนจำหน่าย</option>
              <option value="complaint">แจ้งปัญหาการใช้งานสินค้า</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>

      {/* ตารางข้อความติดต่อ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หัวข้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredForms.map((form) => (
                <tr key={form._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{form.name}</div>
                      <div className="text-sm text-gray-500">{form.email}</div>
                      {form.phone && (
                        <div className="text-sm text-gray-500">{form.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{form.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {categoryLabels[form.category as keyof typeof categoryLabels] || form.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[form.status as keyof typeof statusColors]}`}>
                      {statusLabels[form.status as keyof typeof statusLabels] || form.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(form.createdAt), 'dd/MM/yyyy HH:mm', { locale: th })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedForm(form);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        ดูรายละเอียด
                      </button>
                      <select
                        value={form.status}
                        onChange={(e) => updateStatus(form._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="new">ใหม่</option>
                        <option value="in_progress">กำลังดำเนินการ</option>
                        <option value="completed">เสร็จสิ้น</option>
                        <option value="closed">ปิด</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">ไม่พบข้อความติดต่อ</p>
          </div>
        )}
      </div>

      {/* Modal แสดงรายละเอียด */}
      {showModal && selectedForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">รายละเอียดข้อความติดต่อ</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.email}</p>
                </div>
                
                {selectedForm.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedForm.phone}</p>
                  </div>
                )}
                
                {selectedForm.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">บริษัท/องค์กร</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedForm.company}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">หัวข้อ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {categoryLabels[selectedForm.category as keyof typeof categoryLabels] || selectedForm.category}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ข้อความ</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.message}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่ส่ง</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedForm.createdAt), 'dd/MM/yyyy HH:mm น.', { locale: th })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                  <select
                    value={selectedForm.status}
                    onChange={(e) => updateStatus(selectedForm._id, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="new">ใหม่</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="closed">ปิด</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
