'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface SKUConfig {
  _id: string;
  name: string;
  prefix: string;
  format: string;
  counter: number;
  category?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminSKUConfigsPage = () => {
  const { hasPermission } = usePermissions();
  const [skuConfigs, setSkuConfigs] = useState<SKUConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [format, setFormat] = useState('{PREFIX}-{COUNTER}');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [counter, setCounter] = useState(1);

  // Predefined formats
  const predefinedFormats = [
    { label: 'รูปแบบพื้นฐาน', value: '{PREFIX}-{COUNTER}' },
    { label: 'รูปแบบหมวดหมู่', value: '{PREFIX}-{CATEGORY}-{COUNTER}' },
    { label: 'รูปแบบวันที่', value: '{PREFIX}-{YEAR}{MONTH}-{COUNTER}' },
    { label: 'รูปแบบปี', value: '{PREFIX}-{YEAR}-{COUNTER}' },
    { label: 'รูปแบบแบบกำหนดเอง', value: 'custom' },
  ];

  useEffect(() => {
    fetchSKUConfigs();
  }, []);

  const fetchSKUConfigs = async () => {
    try {
      const response = await fetch('/api/admin/sku-configs', { credentials: 'include' });
      const data = await response.json();
      setSkuConfigs(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูล SKU Configs ได้:', error);
      setLoading(false);
      toast.error('ไม่สามารถดึงข้อมูล SKU Configs ได้');
    }
  };

  const resetForm = () => {
    setName('');
    setPrefix('');
    setFormat('{PREFIX}-{COUNTER}');
    setCategory('');
    setDescription('');
    setIsActive(true);
    setCounter(1);
    setEditMode(false);
    setCurrentConfigId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !prefix || !format) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const url = editMode 
        ? `/api/admin/sku-configs/${currentConfigId}`
        : '/api/admin/sku-configs';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          prefix,
          format,
          category,
          description,
          isActive,
          counter,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาด');
      }

      toast.success(editMode ? 'อัปเดต SKU Config สำเร็จ' : 'สร้าง SKU Config สำเร็จ');
      resetForm();
      fetchSKUConfigs();
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (config: SKUConfig) => {
    setName(config.name);
    setPrefix(config.prefix);
    setFormat(config.format);
    setCategory(config.category || '');
    setDescription(config.description || '');
    setIsActive(config.isActive);
    setCounter(config.counter);
    setEditMode(true);
    setCurrentConfigId(config._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ SKU Config นี้?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sku-configs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการลบ');
      }

      toast.success('ลบ SKU Config สำเร็จ');
      fetchSKUConfigs();
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const config = skuConfigs.find(c => c._id === id);
      if (!config) return;

      const response = await fetch(`/api/admin/sku-configs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...config,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการอัปเดต');
      }

      toast.success(`เปลี่ยนสถานะ SKU Config สำเร็จ`);
      fetchSKUConfigs();
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleFormatChange = (newFormat: string) => {
    if (newFormat === 'custom') {
      setFormat('');
    } else {
      setFormat(newFormat);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_PRODUCTS}>
      <div className="container mx-auto px-4 py-8">
        <Toaster />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการ SKU Configuration</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + สร้าง SKU Config ใหม่
          </button>
        </div>

        {/* SKU Configs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำนำหน้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รูปแบบ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ตัวนับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {skuConfigs.map((config) => (
                  <tr key={config._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{config.name}</div>
                        {config.description && (
                          <div className="text-sm text-gray-500">{config.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {config.prefix}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {config.format}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.counter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(config._id, config.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          config.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {config.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(config._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold mb-6">
                  {editMode ? 'แก้ไข SKU Config' : 'สร้าง SKU Config ใหม่'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อรูปแบบ SKU *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น รูปแบบสินค้าทั่วไป"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำนำหน้า SKU *
                      </label>
                      <input
                        type="text"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น PROD"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รูปแบบ SKU *
                    </label>
                    <select
                      value={predefinedFormats.find(f => f.value === format)?.value || 'custom'}
                      onChange={(e) => handleFormatChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    >
                      {predefinedFormats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="รูปแบบ เช่น {PREFIX}-{COUNTER}"
                      required
                    />
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <p>ตัวแปรที่ใช้ได้:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>{'{PREFIX}'}</code> - คำนำหน้า SKU</li>
                        <li><code>{'{COUNTER}'}</code> - ตัวนับ (4 หลัก)</li>
                        <li><code>{'{CATEGORY}'}</code> - หมวดหมู่</li>
                        <li><code>{'{YEAR}'}</code> - ปี (4 หลัก)</li>
                        <li><code>{'{MONTH}'}</code> - เดือน (2 หลัก)</li>
                        <li><code>{'{DAY}'}</code> - วัน (2 หลัก)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมวดหมู่
                      </label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น กาวและซีล"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ตัวนับเริ่มต้น
                      </label>
                      <input
                        type="number"
                        value={counter}
                        onChange={(e) => setCounter(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับรูปแบบ SKU นี้"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      เปิดใช้งาน
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editMode ? 'อัปเดต' : 'สร้าง'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PermissionGate>
  );
};

export default AdminSKUConfigsPage;
