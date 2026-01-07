'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  level: number; // 1: SuperAdmin, 2: SalesAdmin
  isActive?: boolean;
}

interface AdminRoleRef {
  _id: string;
  name: string;
  level?: number;
}

interface Admin {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string | AdminRoleRef;
  isActive: boolean;
  createdAt: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'admins'>('roles');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rolesResponse = await fetch('/api/adminb2b/roles', { credentials: 'include' });
        const rolesResult = await rolesResponse.json();

        if (rolesResult.success) {
          setRoles(rolesResult.data.roles || []);
          setPermissions(rolesResult.data.permissions || []);
        } else {
          toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท');
        }

        const adminsResponse = await fetch('/api/adminb2b/admins', { credentials: 'include' });
        const adminsResult = await adminsResponse.json();

        if (adminsResult.success) {
          setAdmins(adminsResult.data || []);
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

    loadData();
  }, []);

  const handleRolePermissionToggle = async (roleId: string, permissionId: string) => {
    const targetRole = roles.find(role => role._id === roleId);
    if (!targetRole) return;

    const hasPermission = targetRole.permissions.includes(permissionId);
    const updatedPermissions = hasPermission
      ? targetRole.permissions.filter(p => p !== permissionId)
      : [...targetRole.permissions, permissionId];

    try {
      const response = await fetch(`/api/adminb2b/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions: updatedPermissions }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถอัปเดตสิทธิ์ได้');
      }

      setRoles(prevRoles =>
        prevRoles.map(role =>
          role._id === roleId ? { ...role, permissions: updatedPermissions } : role
        )
      );
      toast.success('อัพเดทสิทธิ์เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
    }
  };

  const handleCreateRole = async () => {
    const name = prompt('ชื่อบทบาท:');
    if (!name) return;

    const description = prompt('คำอธิบาย:');
    if (!description) return;

    try {
      const response = await fetch('/api/adminb2b/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          permissions: [],
          level: 4,
          isActive: true,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถสร้างบทบาทได้');
      }

      setRoles(prev => [...prev, result.data]);
      toast.success('สร้างบทบาทใหม่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างบทบาท');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบทบาทนี้?')) return;
    
    // ตรวจสอบว่ามีแอดมินใช้บทบาทนี้อยู่หรือไม่
    const adminsUsingRole = admins.filter(admin => {
      if (typeof admin.role === 'string') {
        return admin.role === roleId;
      }
      return admin.role?._id === roleId;
    });
    if (adminsUsingRole.length > 0) {
      toast.error('ไม่สามารถลบบทบาทได้ เนื่องจากมีแอดมินใช้งานอยู่');
      return;
    }
    
    try {
      const response = await fetch(`/api/adminb2b/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถลบบทบาทได้');
      }
      setRoles(prev => prev.filter(role => role._id !== roleId));
      toast.success('ลบบทบาทเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('เกิดข้อผิดพลาดในการลบบทบาท');
    }
  };

  const handleCreateAdmin = async () => {
    const name = prompt('ชื่อแอดมิน:');
    if (!name) return;

    const phone = prompt('เบอร์โทรศัพท์:');
    if (!phone) return;

    const email = prompt('อีเมล (ถ้าไม่มีเว้นว่าง):') || '';

    const roleHint = roles.map(role => `${role.name} (${role._id})`).join('\n');
    const roleInput = prompt(`เลือกบทบาทโดยระบุ Role ID หรือชื่อบทบาท:\n${roleHint}`);
    if (!roleInput) return;

    const matchedRole = roles.find(
      role =>
        role._id === roleInput.trim() ||
        role.name.toLowerCase() === roleInput.trim().toLowerCase()
    );
    if (!matchedRole) {
      toast.error('บทบาทไม่ถูกต้อง');
      return;
    }

    try {
      const response = await fetch('/api/adminb2b/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          role: matchedRole._id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถสร้างแอดมินได้');
      }

      setAdmins(prev => [result.data, ...prev]);
      toast.success('สร้างแอดมินใหม่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างแอดมิน');
    }
  };

  const handleToggleAdminStatus = async (adminId: string) => {
    const target = admins.find(admin => admin._id === adminId);
    if (!target) return;

    try {
      const response = await fetch(`/api/adminb2b/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !target.isActive }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถอัปเดตสถานะได้');
      }

      setAdmins(prev =>
        prev.map(admin =>
          admin._id === adminId ? { ...admin, isActive: !admin.isActive } : admin
        )
      );
      toast.success('อัพเดทสถานะแอดมินเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะแอดมิน');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบแอดมินนี้?')) return;

    try {
      const response = await fetch(`/api/adminb2b/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'ไม่สามารถลบแอดมินได้');
      }
      setAdmins(prev => prev.filter(admin => admin._id !== adminId));
      toast.success('ลบแอดมินเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('เกิดข้อผิดพลาดในการลบแอดมิน');
    }
  };

  const getPermissionsByCategory = () => {
    const categories = [...new Set(permissions.map(p => p.category))];
    return categories.map(category => ({
      category,
      permissions: permissions.filter(p => p.category === category)
    }));
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
        <h1 className="text-3xl font-bold text-gray-900">จัดการสิทธิ์และแอดมิน</h1>
        <p className="text-gray-600 mt-2">
          จัดการบทบาท สิทธิ์ และผู้ดูแลระบบ
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            บทบาทและสิทธิ์
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ผู้ดูแลระบบ
          </button>
        </nav>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">บทบาทและสิทธิ์</h2>
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              สร้างบทบาทใหม่
            </button>
          </div>

          <div className="grid gap-6">
            {roles.map((role) => (
              <div key={role._id} className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-gray-600 mt-1">{role.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          role.level === 1 ? 'bg-red-100 text-red-800' :
                          role.level === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {role.level === 1 ? 'Super Admin' :
                           role.level === 2 ? 'Sales Admin' : 'Custom'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {role.permissions.length} สิทธิ์
                        </span>
                      </div>
                    </div>
                    {role.level === 4 && (
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">สิทธิ์ที่ได้รับ</h4>
                  <div className="space-y-4">
                    {getPermissionsByCategory().map(({ category, permissions: categoryPermissions }) => (
                      <div key={category}>
                        <h5 className="font-medium text-gray-700 mb-2">{category}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryPermissions.map((permission) => (
                            <label key={permission.id} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={role.permissions.includes(permission.id)}
                                onChange={() => handleRolePermissionToggle(role._id, permission.id)}
                                disabled={role.level === 1} // Super Admin มีทุกสิทธิ์
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {permission.description}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">ผู้ดูแลระบบ</h2>
            <button
              onClick={handleCreateAdmin}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              เพิ่มแอดมินใหม่
            </button>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
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
                {admins.map((admin) => {
                  const roleId = typeof admin.role === 'string' ? admin.role : admin.role?._id;
                  const role = roles.find(r => r._id === roleId);
                  const roleName = role?.name || (typeof admin.role === 'string' ? undefined : admin.role?.name);
                  const roleLevel = role?.level ?? (typeof admin.role === 'string' ? undefined : admin.role?.level);
                  return (
                    <tr key={admin._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          roleLevel === 1 ? 'bg-red-100 text-red-800' :
                          roleLevel === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {roleName || 'ไม่ระบุ'}
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
                        {new Date(admin.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleAdminStatus(admin._id)}
                            className={`text-sm ${
                              admin.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {admin.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          </button>
                          {roleName !== 'Super Admin' && (
                            <button
                              onClick={() => handleDeleteAdmin(admin._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PermissionsPage;
