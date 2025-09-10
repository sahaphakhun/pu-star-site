"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface Role {
  _id: string;
  name: string;
  description: string;
  level: number;
}

export default function AddAdminPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    team: '',
    zone: ''
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/adminb2b/roles');
      if (res.ok) {
        const data = await res.json();
        const apiRoles = data.data?.roles || [];
        
        // ถ้าไม่มีบทบาทในฐานข้อมูล ให้ใช้บทบาทพื้นฐาน
        if (apiRoles.length === 0) {
          const defaultRoles = [
            { _id: 'super_admin', name: 'Super Admin', description: 'ผู้ดูแลระบบสูงสุด', level: 1 },
            { _id: 'sales_admin', name: 'Sales Admin', description: 'ผู้ดูแลระบบฝ่ายขาย', level: 2 },
            { _id: 'seller', name: 'Seller', description: 'พนักงานขาย', level: 5 }
          ];
          setRoles(defaultRoles);
        } else {
          setRoles(apiRoles);
        }
      } else {
        // ถ้า API ไม่ทำงาน ให้ใช้บทบาทพื้นฐาน
        const defaultRoles = [
          { _id: 'super_admin', name: 'Super Admin', description: 'ผู้ดูแลระบบสูงสุด', level: 1 },
          { _id: 'sales_admin', name: 'Sales Admin', description: 'ผู้ดูแลระบบฝ่ายขาย', level: 2 },
          { _id: 'seller', name: 'Seller', description: 'พนักงานขาย', level: 5 }
        ];
        setRoles(defaultRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      // ถ้าเกิด error ให้ใช้บทบาทพื้นฐาน
      const defaultRoles = [
        { _id: 'super_admin', name: 'Super Admin', description: 'ผู้ดูแลระบบสูงสุด', level: 1 },
        { _id: 'sales_admin', name: 'Sales Admin', description: 'ผู้ดูแลระบบฝ่ายขาย', level: 2 },
        { _id: 'seller', name: 'Seller', description: 'พนักงานขาย', level: 5 }
      ];
      setRoles(defaultRoles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.role) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      // สร้างข้อมูลสำหรับส่งไป API
      const submitData = {
        ...formData,
        // ถ้า role เป็น string ให้แปลงเป็น role name
        role: formData.role.includes('_') ? formData.role : formData.role
      };

      const res = await fetch('/api/adminb2b/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        toast.success('เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว');
        setFormData({
          name: '',
          phone: '',
          email: '',
          company: '',
          role: '',
          team: '',
          zone: ''
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มผู้ดูแลระบบ</h1>
          <p className="text-gray-600 mt-2">เพิ่มผู้ดูแลระบบใหม่พร้อมกำหนดบทบาทและสิทธิ์</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="กรอกอีเมล"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  บริษัท
                </label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="กรอกชื่อบริษัท"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  บทบาท *
                </label>
                <Select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  required
                >
                  <option value="">เลือกบทบาท</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                  ทีม
                </label>
                <Input
                  id="team"
                  type="text"
                  value={formData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  placeholder="กรอกชื่อทีม"
                />
              </div>

              <div>
                <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
                  โซน
                </label>
                <Input
                  id="zone"
                  type="text"
                  value={formData.zone}
                  onChange={(e) => handleInputChange('zone', e.target.value)}
                  placeholder="กรอกโซน"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.history.back()}
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ดูแลระบบ'}
              </Button>
            </div>
          </form>
        </Card>

        {/* บทบาทที่มีในระบบ */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">บทบาทที่มีในระบบ</h2>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  role.level === 1 ? 'bg-red-100 text-red-800' :
                  role.level === 2 ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Level {role.level}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
