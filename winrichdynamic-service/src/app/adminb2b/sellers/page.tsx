'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Role { _id: string; name: string; level: number }
interface Admin { _id: string; name: string; phone: string; email?: string; role: Role | string; isActive: boolean; createdAt: string }

export default function SellersPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [sellers, setSellers] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const rolesRes = await fetch('/api/adminb2b/roles')
      const rolesData = await rolesRes.json()
      if (rolesData?.success) setRoles(rolesData.data.roles)

      const adminsRes = await fetch('/api/adminb2b/admins')
      const adminsData = await adminsRes.json()
      if (adminsData?.success) {
        const list: Admin[] = adminsData.data
        setSellers(list.filter(a => (typeof a.role === 'object' ? a.role.name : a.role) === 'Seller'))
      }
    } catch (e) {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) { toast.error('กรุณากรอกชื่อและเบอร์โทร'); return }
    const sellerRole = roles.find(r => r.name === 'Seller')
    if (!sellerRole) { toast.error('ไม่พบบทบาท Seller'); return }
    try {
      setSaving(true)
      const res = await fetch('/api/adminb2b/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: sellerRole._id })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || 'สร้างผู้ใช้ไม่สำเร็จ')
      toast.success('เพิ่มเซลล์เรียบร้อยแล้ว')
      setForm({ name: '', phone: '', email: '' })
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">เพิ่มเบอร์เซลล์ + ตั้งชื่อ</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">ชื่อเซลล์</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="เช่น คุณสมชาย" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">เบอร์โทร</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="0812345678 หรือ +66812345678" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">อีเมล (ถ้ามี)</label>
              <input className="w-full border rounded px-3 py-2" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button disabled={saving} className={`px-4 py-2 rounded text-white ${saving?'bg-gray-400':'bg-blue-600 hover:bg-blue-700'}`}>{saving?'กำลังบันทึก...':'เพิ่มเซลล์'}</button>
          </div>
        </form>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b font-semibold">รายชื่อเซลล์</div>
          {loading ? (
            <div className="p-6">กำลังโหลด...</div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">ชื่อ</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">เบอร์</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">อีเมล</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">วันที่สร้าง</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map(s => (
                  <tr key={s._id} className="border-t">
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.phone}</td>
                    <td className="px-4 py-2">{s.email || '-'}</td>
                    <td className="px-4 py-2">{new Date(s.createdAt).toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric'})}</td>
                  </tr>
                ))}
                {sellers.length===0 && (
                  <tr><td className="px-4 py-4 text-gray-500" colSpan={4}>ยังไม่มีเซลล์</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

