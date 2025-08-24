'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
}

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const savedRoles = localStorage.getItem('b2b_roles');
      const savedAdmins = localStorage.getItem('b2b_admins');
      
      if (savedRoles) {
        setRoles(JSON.parse(savedRoles));
      }
      
      if (savedAdmins) {
        setAdmins(JSON.parse(savedAdmins));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingAdmin = admins.find(admin => admin.email === formData.email);
    if (existingAdmin) {
      toast.error('อีเมลนี้มีแอดมินใช้งานอยู่แล้ว');
      return;
    }

    const newAdmin: Admin = {
      id: `admin_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setAdmins(prev => {
      const updated = [...prev, newAdmin];
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });

    // Reset form
    setFormData({ name: '', email: '', role: '', password: '' });
    setShowCreateForm(false);
    toast.success('สร้างแอดมินใหม่เรียบร้อยแล้ว');
  };

  const handleUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAdmin) return;
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (ยกเว้นแอดมินที่กำลังแก้ไข)
    const existingAdmin = admins.find(admin => 
      admin.email === formData.email && admin.id !== editingAdmin.id
    );
    if (existingAdmin) {
      toast.error('อีเมลนี้มีแอดมินใช้งานอยู่แล้ว');
      return;
    }

    setAdmins(prev => {
      const updated = prev.map(admin => 
        admin.id === editingAdmin.id 
          ? { 
              ...admin, 
              name: formData.name, 
              email: formData.email, 
              role: formData.role 
            }
          : admin
      );
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });

    // Reset form
    setFormData({ name: '', email: '', role: '', password: '' });
    setEditingAdmin(null);
    toast.success('อัพเดทข้อมูลแอดมินเรียบร้อยแล้ว');
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', role: '', password: '' });
  };

  const handleToggleAdminStatus = (adminId: string) => {
    setAdmins(prev => {
      const updated = prev.map(admin => 
        admin.id === adminId ? { ...admin, isActive: !admin.isActive } : admin
      );
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('อัพเดทสถานะแอดมินเรียบร้อยแล้ว');
  };

  const handleDeleteAdmin = (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    if (admin?.role === 'super_admin') {
      toast.error('ไม่สามารถลบ Super Admin ได้');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบแอดมินนี้?')) return;
    
    setAdmins(prev => {
      const updated = prev.filter(admin => admin.id !== adminId);
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('ลบแอดมินเรียบร้อยแล้ว');
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'ไม่ระบุ';
  };

  const getRoleColor = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role.level) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ดูแลระบบ</h1>
        <p className="text-gray-600 mt-2">
          จัดการผู้ดูแลระบบและสิทธิ์การเข้าถึง
        </p>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingAdmin) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingAdmin ? 'แก้ไขแอดมิน' : 'เพิ่มแอดมินใหม่'}
          </h2>
          
          <form onSubmit={editingAdmin ? handleUpdateAdmin : handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแอดมิน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อแอดมิน"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  บทบาท <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">เลือกบทบาท</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="รหัสผ่าน"
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={editingAdmin ? handleCancelEdit : () => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingAdmin ? 'อัพเดท' : 'สร้าง'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">รายการแอดมิน</h2>
            {!showCreateForm && !editingAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                เพิ่มแอดมินใหม่
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แอดมิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(admin.role)}`}>
                      {getRoleName(admin.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleToggleAdminStatus(admin.id)}
                        className={`${
                          admin.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {admin.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </button>
                      {admin.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {admins.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">ยังไม่มีแอดมิน</div>
              <div className="text-gray-400 text-sm mt-2">
                เพิ่มแอดมินคนแรกเพื่อเริ่มต้นการใช้งาน
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminsPage;
