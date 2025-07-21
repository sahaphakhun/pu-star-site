'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  phoneNumber: string;
  name: string;
  email: string;
  profileImageUrl: string;
  customerType: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  displayText: string;
}

interface Permission {
  key: string;
  name: string;
  description: string;
}

interface PermissionGroup {
  name: string;
  icon: string;
  permissions: Permission[];
}

interface UserPermission {
  _id: string;
  phoneNumber: string;
  permissions: string[];
  grantedBy: string;
  grantedAt: string;
  isActive: boolean;
  note?: string;
  userName: string;
  userEmail: string;
  userProfileImage: string;
}

const PermissionsManagePage: React.FC = () => {
  // States
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<{[key: string]: PermissionGroup}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<UserPermission | null>(null);

  // ดึงข้อมูลสิทธิ์ที่มีในระบบ
  const fetchAvailablePermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/permissions/available', {
        headers: {
          'Authorization': 'Bearer admin-token',
          'x-admin-phone': '+66900000000', // ใส่เบอร์แอดมินจริง
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data.data.groups);
      } else {
        console.error('Failed to fetch available permissions');
      }
    } catch (error) {
      console.error('Error fetching available permissions:', error);
    }
  }, []);

  // ดึงข้อมูลรายการผู้ใช้ที่มีสิทธิ์
  const fetchUserPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': 'Bearer admin-token',
          'x-admin-phone': '+66900000000', // ใส่เบอร์แอดมินจริง
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.data);
      } else {
        console.error('Failed to fetch user permissions');
        toast.error('ไม่สามารถดึงข้อมูลสิทธิ์ได้');
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  // ค้นหาผู้ใช้
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': 'Bearer admin-token',
          'x-admin-phone': '+66900000000', // ใส่เบอร์แอดมินจริง
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      } else {
        console.error('Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // เพิ่ม/อัปเดตสิทธิ์ผู้ใช้
  const saveUserPermissions = async () => {
    if (!selectedUser || selectedPermissions.length === 0) {
      toast.error('กรุณาเลือกผู้ใช้และสิทธิ์');
      return;
    }

    try {
      const method = editingPermission ? 'PUT' : 'POST';
      const url = editingPermission 
        ? `/api/admin/permissions/${encodeURIComponent(selectedUser.phoneNumber)}`
        : '/api/admin/permissions';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
          'x-admin-phone': '+66900000000', // ใส่เบอร์แอดมินจริง
        },
        body: JSON.stringify({
          phoneNumber: selectedUser.phoneNumber,
          permissions: selectedPermissions,
          note,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchUserPermissions();
        resetForm();
        setShowPermissionModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // ลบสิทธิ์ผู้ใช้
  const deleteUserPermissions = async (phoneNumber: string) => {
    if (!confirm('คุณต้องการลบสิทธิ์ของผู้ใช้นี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/permissions/${encodeURIComponent(phoneNumber)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token',
          'x-admin-phone': '+66900000000', // ใส่เบอร์แอดมินจริง
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchUserPermissions();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setSelectedUser(null);
    setSelectedPermissions([]);
    setNote('');
    setSearchTerm('');
    setSearchResults([]);
    setEditingPermission(null);
  };

  // เปิด modal แก้ไขสิทธิ์
  const openEditModal = (permission: UserPermission) => {
    setEditingPermission(permission);
    setSelectedUser({
      phoneNumber: permission.phoneNumber,
      name: permission.userName,
      email: permission.userEmail,
      profileImageUrl: permission.userProfileImage,
      customerType: '',
      totalOrders: 0,
      totalSpent: 0,
      displayText: `${permission.userName} (${permission.phoneNumber})`,
    });
    setSelectedPermissions(permission.permissions);
    setNote(permission.note || '');
    setShowPermissionModal(true);
  };

  // toggle สิทธิ์
  const togglePermission = (permissionKey: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  useEffect(() => {
    fetchAvailablePermissions();
    fetchUserPermissions();
  }, [fetchAvailablePermissions, fetchUserPermissions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการสิทธิ์ผู้ใช้</h1>
          <p className="text-gray-600">มอบสิทธิ์เฉพาะให้กับผู้ใช้ในระบบ</p>
        </div>
        <button
          onClick={() => setShowPermissionModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">👥</span>
          เพิ่มสิทธิ์ผู้ใช้
        </button>
      </div>

      {/* รายการผู้ใช้ที่มีสิทธิ์ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">ผู้ใช้ที่มีสิทธิ์เฉพาะ</h2>
          <p className="text-gray-600">รายการผู้ใช้ที่ได้รับสิทธิ์เพิ่มเติมในระบบ</p>
        </div>

        {userPermissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีผู้ใช้ที่ได้รับสิทธิ์</h3>
            <p className="text-gray-500 mb-4">เริ่มต้นด้วยการมอบสิทธิ์ให้กับผู้ใช้คนแรก</p>
            <button
              onClick={() => setShowPermissionModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              เพิ่มสิทธิ์ผู้ใช้
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สิทธิ์ที่ได้รับ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ให้สิทธิ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ให้สิทธิ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userPermissions.map((permission) => (
                  <tr key={permission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {permission.userProfileImage ? (
                            <img className="h-10 w-10 rounded-full" src={permission.userProfileImage} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-sm">
                                {permission.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{permission.userName}</div>
                          <div className="text-sm text-gray-500">{permission.phoneNumber}</div>
                          {permission.userEmail && (
                            <div className="text-xs text-gray-400">{permission.userEmail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {permission.permissions.slice(0, 3).map((perm) => {
                          const permissionInfo = Object.values(availablePermissions)
                            .flatMap(group => group.permissions)
                            .find(p => p.key === perm);
                          return (
                            <span key={perm} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                              {permissionInfo?.name || perm}
                            </span>
                          );
                        })}
                        {permission.permissions.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{permission.permissions.length - 3} เพิ่มเติม
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.grantedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(permission.grantedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permission.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {permission.isActive ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(permission)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => deleteUserPermissions(permission.phoneNumber)}
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
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขสิทธิ์ */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingPermission ? 'แก้ไขสิทธิ์ผู้ใช้' : 'เพิ่มสิทธิ์ผู้ใช้'}
                </h3>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ค้นหาผู้ใช้ */}
              {!editingPermission && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหาผู้ใช้
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ระบุเบอร์โทรศัพท์ ชื่อ หรืออีเมล (อย่างน้อย 3 ตัวอักษร)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>

                  {/* ผลการค้นหา */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.phoneNumber}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                            setSearchTerm('');
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {user.profileImageUrl ? (
                                <img className="h-8 w-8 rounded-full" src={user.profileImageUrl} alt="" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 text-xs font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ผู้ใช้ที่เลือก */}
              {selectedUser && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {selectedUser.profileImageUrl ? (
                        <img className="h-12 w-12 rounded-full" src={selectedUser.profileImageUrl} alt="" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                          <span className="text-blue-800 font-medium">
                            {selectedUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-blue-900">{selectedUser.name}</h4>
                      <p className="text-blue-700">{selectedUser.phoneNumber}</p>
                      {selectedUser.email && (
                        <p className="text-sm text-blue-600">{selectedUser.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* เลือกสิทธิ์ */}
              {selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    เลือกสิทธิ์ที่ต้องการมอบให้
                  </label>
                  
                  <div className="space-y-6">
                    {Object.entries(availablePermissions).map(([groupKey, group]) => (
                      <div key={groupKey} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <span className="text-xl mr-2">{group.icon}</span>
                          <h5 className="text-lg font-medium text-gray-900">{group.name}</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.permissions.map((permission) => (
                            <label key={permission.key} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.key)}
                                onChange={() => togglePermission(permission.key)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* หมายเหตุ */}
              {selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเหตุ (ไม่บังคับ)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับการมอบสิทธิ์นี้..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* ปุ่มบันทึก */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              {selectedUser && selectedPermissions.length > 0 && (
                <button
                  onClick={saveUserPermissions}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPermission ? 'อัปเดตสิทธิ์' : 'บันทึกสิทธิ์'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagePage; 