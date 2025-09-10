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
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number; // 1: SuperAdmin, 2: SalesAdmin
}

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'admins'>('roles');

  // ข้อมูลสิทธิ์พื้นฐาน
  const basePermissions: Permission[] = [
    // ภาพรวม
    { id: 'dashboard_view', name: 'ดูภาพรวม', description: 'เข้าถึงแดชบอร์ดและสถิติ', category: 'ภาพรวม' },
    
    // ลูกค้า
    { id: 'customers_view', name: 'ดูลูกค้า', description: 'ดูรายการลูกค้า', category: 'ลูกค้า' },
    { id: 'customers_create', name: 'สร้างลูกค้า', description: 'เพิ่มลูกค้าใหม่', category: 'ลูกค้า' },
    { id: 'customers_edit', name: 'แก้ไขลูกค้า', description: 'แก้ไขข้อมูลลูกค้า', category: 'ลูกค้า' },
    { id: 'customers_delete', name: 'ลบลูกค้า', description: 'ลบลูกค้าออกจากระบบ', category: 'ลูกค้า' },
    
    // ใบเสนอราคา
    { id: 'quotations_view', name: 'ดูใบเสนอราคา', description: 'ดูรายการใบเสนอราคา', category: 'ใบเสนอราคา' },
    { id: 'quotations_create', name: 'สร้างใบเสนอราคา', description: 'สร้างใบเสนอราคาใหม่', category: 'ใบเสนอราคา' },
    { id: 'quotations_edit', name: 'แก้ไขใบเสนอราคา', description: 'แก้ไขใบเสนอราคา', category: 'ใบเสนอราคา' },
    { id: 'quotations_delete', name: 'ลบใบเสนอราคา', description: 'ลบใบเสนอราคา', category: 'ใบเสนอราคา' },
    { id: 'quotations_send', name: 'ส่งใบเสนอราคา', description: 'ส่งใบเสนอราคาให้ลูกค้า', category: 'ใบเสนอราคา' },
    { id: 'quotations_convert', name: 'แปลงเป็นออเดอร์', description: 'แปลงใบเสนอราคาเป็นออเดอร์', category: 'ใบเสนอราคา' },
    
    // สินค้า
    { id: 'products_view', name: 'ดูสินค้า', description: 'ดูรายการสินค้า', category: 'สินค้า' },
    { id: 'products_create', name: 'สร้างสินค้า', description: 'เพิ่มสินค้าใหม่', category: 'สินค้า' },
    { id: 'products_edit', name: 'แก้ไขสินค้า', description: 'แก้ไขข้อมูลสินค้า', category: 'สินค้า' },
    { id: 'products_delete', name: 'ลบสินค้า', description: 'ลบสินค้าออกจากระบบ', category: 'สินค้า' },
    
    // หมวดหมู่
    { id: 'categories_view', name: 'ดูหมวดหมู่', description: 'ดูรายการหมวดหมู่', category: 'หมวดหมู่' },
    { id: 'categories_create', name: 'สร้างหมวดหมู่', description: 'เพิ่มหมวดหมู่ใหม่', category: 'หมวดหมู่' },
    { id: 'categories_edit', name: 'แก้ไขหมวดหมู่', description: 'แก้ไขหมวดหมู่', category: 'หมวดหมู่' },
    { id: 'categories_delete', name: 'ลบหมวดหมู่', description: 'ลบหมวดหมู่', category: 'หมวดหมู่' },
    
    // ออเดอร์
    { id: 'orders_view', name: 'ดูออเดอร์', description: 'ดูรายการออเดอร์', category: 'ออเดอร์' },
    { id: 'orders_create', name: 'สร้างออเดอร์', description: 'สร้างออเดอร์ใหม่', category: 'ออเดอร์' },
    { id: 'orders_edit', name: 'แก้ไขออเดอร์', description: 'แก้ไขออเดอร์', category: 'ออเดอร์' },
    { id: 'orders_delete', name: 'ลบออเดอร์', description: 'ลบออเดอร์', category: 'ออเดอร์' },
    { id: 'orders_status', name: 'เปลี่ยนสถานะออเดอร์', description: 'อัพเดทสถานะออเดอร์', category: 'ออเดอร์' },
    
    // การตั้งค่า
    { id: 'settings_general', name: 'ตั้งค่าทั่วไป', description: 'แก้ไขการตั้งค่าทั่วไป', category: 'การตั้งค่า' },
    { id: 'settings_permissions', name: 'จัดการสิทธิ์', description: 'จัดการสิทธิ์และบทบาท', category: 'การตั้งค่า' },
    { id: 'settings_admins', name: 'จัดการแอดมิน', description: 'จัดการผู้ดูแลระบบ', category: 'การตั้งค่า' },
  ];

  // ข้อมูลบทบาทพื้นฐาน
  const baseRoles: Role[] = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'ผู้ดูแลระบบสูงสุด - เข้าถึงทุกฟีเจอร์',
      permissions: basePermissions.map(p => p.id),
      level: 1
    },
    {
      id: 'sales_admin',
      name: 'Sales Admin',
      description: 'ผู้ดูแลฝ่ายขาย - จัดการลูกค้า, ใบเสนอราคา, ออเดอร์',
      permissions: [
        'dashboard_view',
        'customers_view', 'customers_create', 'customers_edit',
        'quotations_view', 'quotations_create', 'quotations_edit', 'quotations_send', 'quotations_convert',
        'products_view',
        'categories_view',
        'orders_view', 'orders_create', 'orders_edit', 'orders_status'
      ],
      level: 2
    }
  ];

  useEffect(() => {
    // โหลดข้อมูลจาก localStorage หรือ API
      const loadData = async () => {
    try {
      // ดึงข้อมูลบทบาทและสิทธิ์จาก API
      const rolesResponse = await fetch('/api/adminb2b/roles');
      const rolesResult = await rolesResponse.json();
      
      if (rolesResult.success) {
        setRoles(rolesResult.data.roles);
        setPermissions(rolesResult.data.permissions);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท');
      }
      
      // ดึงข้อมูลผู้ดูแลระบบจาก API
      const adminsResponse = await fetch('/api/adminb2b/admins');
      const adminsResult = await adminsResponse.json();
      
      if (adminsResult.success) {
        setAdmins(adminsResult.data);
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

  const handleRolePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prevRoles => {
      const updatedRoles = prevRoles.map(role => {
        if (role.id === roleId) {
          const hasPermission = role.permissions.includes(permissionId);
          const updatedPermissions = hasPermission
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId];
          
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      });
      
      localStorage.setItem('b2b_roles', JSON.stringify(updatedRoles));
      return updatedRoles;
    });
    
    toast.success('อัพเดทสิทธิ์เรียบร้อยแล้ว');
  };

  const handleCreateRole = () => {
    const name = prompt('ชื่อบทบาท:');
    if (!name) return;
    
    const description = prompt('คำอธิบาย:');
    if (!description) return;
    
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name,
      description,
      permissions: [],
      level: 4 // Custom role
    };
    
    setRoles(prev => {
      const updated = [...prev, newRole];
      localStorage.setItem('b2b_roles', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('สร้างบทบาทใหม่เรียบร้อยแล้ว');
  };

  const handleDeleteRole = (roleId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบทบาทนี้?')) return;
    
    // ตรวจสอบว่ามีแอดมินใช้บทบาทนี้อยู่หรือไม่
    const adminsUsingRole = admins.filter(admin => admin.role === roleId);
    if (adminsUsingRole.length > 0) {
      toast.error('ไม่สามารถลบบทบาทได้ เนื่องจากมีแอดมินใช้งานอยู่');
      return;
    }
    
    setRoles(prev => {
      const updated = prev.filter(role => role.id !== roleId);
      localStorage.setItem('b2b_roles', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('ลบบทบาทเรียบร้อยแล้ว');
  };

  const handleCreateAdmin = () => {
    const name = prompt('ชื่อแอดมิน:');
    if (!name) return;
    
    const email = prompt('อีเมล:');
    if (!email) return;
    
    const roleId = prompt('เลือกบทบาท (super_admin, sales_admin):');
    if (!roleId || !roles.find(r => r.id === roleId)) {
      toast.error('บทบาทไม่ถูกต้อง');
      return;
    }
    
    const newAdmin: Admin = {
      id: `admin_${Date.now()}`,
      name,
      email,
      role: roleId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    setAdmins(prev => {
      const updated = [...prev, newAdmin];
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('สร้างแอดมินใหม่เรียบร้อยแล้ว');
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
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบแอดมินนี้?')) return;
    
    setAdmins(prev => {
      const updated = prev.filter(admin => admin.id !== adminId);
      localStorage.setItem('b2b_admins', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('ลบแอดมินเรียบร้อยแล้ว');
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
              <div key={role.id} className="bg-white rounded-lg border shadow-sm">
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
                        onClick={() => handleDeleteRole(role.id)}
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
                                onChange={() => handleRolePermissionToggle(role.id, permission.id)}
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
                  const role = roles.find(r => r.id === admin.role);
                  return (
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          role?.level === 1 ? 'bg-red-100 text-red-800' :
                          role?.level === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {role?.name || 'ไม่ระบุ'}
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
                            onClick={() => handleToggleAdminStatus(admin.id)}
                            className={`text-sm ${
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
