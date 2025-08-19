'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface AdminPhone {
  _id: string;
  phoneNumber: string;
}

const AdminsPage = () => {
  const [phones, setPhones] = useState<AdminPhone[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPhones = async () => {
    try {
      const res = await fetch('/api/admin/admin-phones', { credentials: 'include' });
      const data = await res.json();
      setPhones(data);
    } catch (err) {
      toast.error('ไม่สามารถโหลดรายชื่อผู้ดูแล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhones();
  }, []);

  const addPhone = async () => {
    if (!newPhone) return;
    try {
      const res = await fetch('/api/admin/admin-phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: newPhone }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('เพิ่มเบอร์ผู้ดูแลแล้ว');
        setNewPhone('');
        fetchPhones();
      } else {
        const d = await res.json();
        toast.error(d.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">จัดการผู้ดูแล</h1>

      <div className="flex mb-6 gap-2">
        <input
          type="text"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="เบอร์โทร เช่น 0812345678 หรือ 66812345678"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={addPhone}
          className="bg-blue-600 text-white px-4 rounded-lg"
        >
          เพิ่ม
        </button>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <ul className="space-y-2">
          {phones.map((p) => (
            <li key={p._id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
              <span>{p.phoneNumber}</span>
              <button
                onClick={async ()=>{
                  const ok = confirm('ยืนยันลบเบอร์นี้?');
                  if(!ok) return;
                  try{
                    const res = await fetch('/api/admin/admin-phones',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p._id}), credentials: 'include'});
                    if(res.ok){toast.success('ลบแล้ว');fetchPhones();}
                    else {const d=await res.json();toast.error(d.message||'ผิดพลาด');}
                  }catch{toast.error('ผิดพลาด');}
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >ลบ</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminsPage; 