'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import QuotationForm from '@/components/QuotationForm'
import AdminModal from '@/components/AdminModal'

interface Quotation {
  _id: string
  quotationNumber: string
  customerName: string
  subject: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  grandTotal: number
  validUntil: string
  createdAt: string
  assignedTo?: string
}

interface Customer {
  _id: string
  name: string
  taxId?: string
  companyAddress?: string
  companyPhone?: string
}

export default function AdminB2BQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [adminMap, setAdminMap] = useState<Record<string, string>>({})

  // ดึงข้อมูลลูกค้าทั้งหมด
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า')
      }
      const data = await response.json()
      setCustomers(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า')
    }
  }

  // ดึงข้อมูลใบเสนอราคาทั้งหมด
  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quotations')
      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา')
      }
      const data = await response.json()
      setQuotations(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error('Error fetching quotations:', error)
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา')
    } finally {
      setLoading(false)
    }
  }

  // ดึงรายชื่อผู้ใช้ (สำหรับแปลง assignedTo id -> name)
  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/adminb2b/admins')
      const data = await res.json()
      const map: Record<string, string> = {}
      if (data?.success && Array.isArray(data.data)) {
        for (const a of data.data) {
          if (a?._id && a?.name) map[a._id] = a.name
        }
      }
      setAdminMap(map)
    } catch {}
  }

  // สร้างใบเสนอราคาใหม่
  const handleCreateQuotation = async (quotationData: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา')
      }

      await fetchQuotations()
      setShowForm(false)
      toast.success('สร้างใบเสนอราคาใหม่เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error creating quotation:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา')
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  // อัพเดทใบเสนอราคา
  const handleUpdateQuotation = async (quotationData: any) => {
    if (!editingQuotation) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/quotations/${editingQuotation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดทใบเสนอราคา')
      }

      await fetchQuotations()
      setEditingQuotation(null)
      toast.success('อัพเดทข้อมูลใบเสนอราคาเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error updating quotation:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดทใบเสนอราคา')
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  // ลบใบเสนอราคา
  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการลบใบเสนอราคา')
      }

      await fetchQuotations()
      toast.success('ลบใบเสนอราคาเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error deleting quotation:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบใบเสนอราคา')
    }
  }

  // ดูใบเสนอราคา
  const handleViewQuotation = (quotation: Quotation) => {
    // เปิดหน้าใหม่เพื่อดูใบเสนอราคา
    window.open(`/adminb2b/quotations/${quotation._id}/view`, '_blank')
  }

  // โหลด PDF
  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการสร้าง PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ใบเสนอราคา_${quotation.quotationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('ดาวน์โหลด PDF เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('เกิดข้อผิดพลาดในการดาวน์โหลด PDF')
    }
  }

  // แก้ไขใบเสนอราคา
  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation)
    setShowForm(true)
  }

  // ยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingQuotation(null)
    setShowForm(false)
  }

  // ยกเลิกการสร้างใหม่
  const handleCancelCreate = () => {
    setShowForm(false)
  }

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchCustomers()
    fetchQuotations()
    fetchAdmins()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-gray-100 text-gray-800'
      case 'accepted': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'ร่าง'
      case 'sent': return 'ส่งแล้ว'
      case 'accepted': return 'ยอมรับ'
      case 'rejected': return 'ปฏิเสธ'
      case 'expired': return 'หมดอายุ'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการใบเสนอราคา</h1>
              <p className="text-gray-600 mt-2">
                จัดการใบเสนอราคา เพิ่ม แก้ไข ลบ และส่ง
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                สร้างใบเสนอราคาใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Quotation Form Modal */}
        <AdminModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          maxWidth="max-w-6xl"
          maxHeight="max-h-[90vh]"
        >
          <QuotationForm
            initialData={editingQuotation || undefined}
            customers={customers}
            onSubmit={editingQuotation ? handleUpdateQuotation : handleCreateQuotation}
            onCancel={editingQuotation ? handleCancelEdit : handleCancelCreate}
            isEditing={!!editingQuotation}
            loading={formLoading}
          />
        </AdminModal>

        {/* Quotations List */}
        <div className="bg-white rounded-lg border shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">ยังไม่มีใบเสนอราคา</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
              >
                สร้างใบเสนอราคาแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      เลขที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      หัวข้อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ราคารวม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      วันหมดอายุ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ผู้รับผิดชอบ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      วันที่สร้าง
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {quotations.map((quotation) => (
                    <tr
                      key={quotation._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quotation.quotationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quotation.customerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {quotation.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                          {getStatusLabel(quotation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(quotation.grandTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(quotation.validUntil)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {adminMap[quotation.assignedTo || ''] || quotation.assignedTo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(quotation.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewQuotation(quotation)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            ดูใบเสนอราคา
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(quotation)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            โหลด PDF
                          </button>
                          <button
                            onClick={() => handleEditQuotation(quotation)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            แก้ไข
                          </button>
 
                          {quotation.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteQuotation(quotation._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

