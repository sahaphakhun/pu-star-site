'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Admin {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: any; // populated object or role id string
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: string; // normalized from _id
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
    phone: '',
    email: '',
    role: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ดึงข้อมูลบทบาทจาก API
      const rolesResponse = await fetch('/api/adminb2b/roles', { credentials: 'include' });
      const rolesResult = await rolesResponse.json();
      
      if (rolesResult.success) {
        const rs = (rolesResult.data.roles || []).map((r: any) => ({ id: r._id, name: r.name, description: r.description, level: r.level }));
        setRoles(rs);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท');
      }
      
      // ดึงข้อมูลผู้ดูแลระบบจาก API
      const adminsResponse = await fetch('/api/adminb2b/admins', { credentials: 'include' });
      const adminsResult = await adminsResponse.json();
      
      if (adminsResult.success) {
        // กรองเฉพาะผู้ใช้ที่มีบทบาท seller, super_admin, sales_admin
        const filteredAdmins = adminsResult.data.filter((admin: Admin) => {
          const roleName = admin.role?.name?.toLowerCase() || '';
          return ['seller', 'super admin', 'sales admin'].includes(roleName);
        });
        setAdmins(filteredAdmins);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.role) {
      toast.error('กรุณากรอกชื่อ เบอร์โทร และบทบาท');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/adminb2b/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'สร้างผู้ใช้ไม่สำเร็จ');
      toast.success('สร้างผู้ใช้เรียบร้อยแล้ว');
      setFormData({ name: '', phone: '', email: '', role: '' });
      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    if (!formData.name || !formData.role) {
      toast.error('กรุณากรอกชื่อและบทบาท');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/adminb2b/admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'อัพเดทไม่สำเร็จ');
      toast.success('อัพเดทข้อมูลเรียบร้อยแล้ว');
      setEditingAdmin(null);
      setFormData({ name: '', phone: '', email: '', role: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      phone: admin.phone || '',
      email: admin.email || '',
      role: typeof admin.role === 'object' ? (admin.role?._id || '') : (admin.role || '')
    });
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setFormData({ name: '', phone: '', email: '', role: '' });
  };

  const handleToggleAdminStatus = async (adminId: string) => {
    try {
      const admin = admins.find(a => a._id === adminId);
      if (!admin) return;
      const res = await fetch(`/api/adminb2b/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !admin.isActive })
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'อัพเดทไม่สำเร็จ');
      toast.success('อัพเดทสถานะแอดมินเรียบร้อยแล้ว');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    const admin = admins.find(a => a._id === adminId);
    const roleName = admin?.role?.name || '';
    
    // ป้องกันการลบ Super Admin
    if (roleName === 'Super Admin') {
      toast.error('ไม่สามารถลบ Super Admin ได้');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบสมาชิก "${admin?.name}" (${roleName})?`)) return;
    
    try {
      const res = await fetch(`/api/adminb2b/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'ลบไม่สำเร็จ');
      toast.success('ลบสมาชิกเรียบร้อยแล้ว');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const getRoleName = (roleVal: any) => {
    if (roleVal && typeof roleVal === 'object' && roleVal.name) return roleVal.name;
    const role = roles.find(r => r.id === roleVal);
    return role?.name || 'ไม่ระบุ';
  };

  const getRoleColor = (roleVal: any) => {
    const role = (roleVal && typeof roleVal === 'object') ? { level: roleVal.level } : roles.find(r => r.id === roleVal);
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch ((role as any).level) {
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
                  ชื่อผู้ใช้/เซลล์ <span className="text-red-500">*</span>
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
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0812345678 หรือ +66812345678"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล (ถ้ามี)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
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
                disabled={saving}
                className={`px-4 py-2 rounded-md text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
              >
                {saving ? 'กำลังบันทึก...' : editingAdmin ? 'อัพเดท' : 'สร้าง'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">รายการสมาชิกระบบ</h2>
              <p className="text-sm text-gray-600 mt-1">
                จัดการผู้ใช้ที่มีบทบาท Seller, Sales Admin, และ Super Admin
                <span className="ml-2 text-blue-600">
                  (รวม {admins.length} คน)
                </span>
              </p>
            </div>
            {!showCreateForm && !editingAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                เพิ่มสมาชิกใหม่
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
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
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.phone}</div>
                      <div className="text-sm text-gray-500">{admin.email || '-'}</div>
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
                        onClick={() => handleToggleAdminStatus(admin._id)}
                        className={`${
                          admin.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {admin.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </button>
                      {admin.role?.name !== 'Super Admin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="text-red-600 hover:text-red-900"
                          title="ลบสมาชิก"
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
