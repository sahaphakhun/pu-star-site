'use client'

import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import QuotationForm from '@/components/QuotationForm'
import AdminModal from '@/components/AdminModal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useTokenManager } from '@/utils/tokenManager'
import { buildSalesOrderNumber } from '@/utils/salesOrderNumber'

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
  salesOrderNumber?: string
}

interface Customer {
  _id: string
  name: string
  phoneNumber?: string
  taxId?: string
  companyAddress?: string
  companyPhone?: string
  shippingAddress?: string
  shippingSameAsCompany?: boolean
}

interface PromptField {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
}

interface PromptConfig {
  title: string
  description?: string
  fields: PromptField[]
  confirmLabel?: string
  cancelLabel?: string
}

export default function AdminB2BQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [adminMap, setAdminMap] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [changingStatusId, setChangingStatusId] = useState<string>('')
  const [sendingId, setSendingId] = useState<string>('')
  const { getValidToken } = useTokenManager()
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [promptValues, setPromptValues] = useState<Record<string, string>>({})
  const [promptError, setPromptError] = useState<string | null>(null)
  const [promptSubmitting, setPromptSubmitting] = useState(false)
  const promptActionRef = useRef<((values: Record<string, string>) => Promise<void> | void) | null>(null)

  const openPrompt = (
    config: PromptConfig,
    onConfirm: (values: Record<string, string>) => Promise<void> | void
  ) => {
    const initialValues = config.fields.reduce((acc, field) => {
      acc[field.name] = ''
      return acc
    }, {} as Record<string, string>)
    setPromptValues(initialValues)
    setPromptConfig(config)
    setPromptError(null)
    promptActionRef.current = onConfirm
  }

  const closePrompt = () => {
    setPromptConfig(null)
    setPromptValues({})
    setPromptError(null)
    setPromptSubmitting(false)
    promptActionRef.current = null
  }

  const handlePromptSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault()
    if (!promptConfig) return

    const missing = promptConfig.fields.find(
      (field) => field.required && !promptValues[field.name]?.trim()
    )
    if (missing) {
      setPromptError(`กรุณาระบุ${missing.label}`)
      return
    }

    setPromptSubmitting(true)
    try {
      await promptActionRef.current?.(promptValues)
      closePrompt()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      setPromptError(message)
    } finally {
      setPromptSubmitting(false)
    }
  }

  const handlePromptValueChange = (name: string, value: string) => {
    setPromptValues((prev) => ({ ...prev, [name]: value }))
    if (promptError) setPromptError(null)
  }

  // ดึงข้อมูลลูกค้าทั้งหมด
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', { credentials: 'include' })
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
      const query = new URLSearchParams()
      if (statusFilter) query.set('status', statusFilter)
      const response = await fetch(
        `/api/quotations${query.toString() ? `?${query.toString()}` : ''}`,
        { credentials: 'include' }
      )
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
      const res = await fetch('/api/adminb2b/admins', { credentials: 'include' })
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
        credentials: 'include',
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

  // ส่งใบเสนอราคา (LINE) และตั้งสถานะเป็นส่งแล้ว
  const handleSendViaLine = async (quotation: Quotation) => {
    try {
      setSendingId(quotation._id)
      // ลองดึงชื่อผู้ส่งจากโปรไฟล์แอดมิน
      let sentBy = 'ระบบ'
      try {
        const token = await getValidToken()
        if (token) {
          const res = await fetch('/api/adminb2b/profile', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          })
          const data = await res.json()
          if (data?.success && data?.data?.name) sentBy = String(data.data.name)
        }
      } catch {}

      const res = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ method: 'line', sentBy })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'ส่งใบเสนอราคาไม่สำเร็จ')
      }
      await fetchQuotations()
      toast.success('ส่งใบเสนอราคา (LINE) เรียบร้อยแล้ว')
    } catch (e) {
      console.error('Error sending quotation via LINE:', e)
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการส่ง')
    } finally {
      setSendingId('')
    }
  }

  const submitUpdateQuotation = async (quotationData: any, remark: string) => {
    if (!editingQuotation) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/quotations/${editingQuotation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...quotationData, remark }),
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

  // อัพเดทใบเสนอราคา
  const handleUpdateQuotation = async (quotationData: any) => {
    if (!editingQuotation) return

    openPrompt(
      {
        title: 'หมายเหตุการแก้ไข',
        description: 'กรุณาระบุหมายเหตุก่อนบันทึกการแก้ไข',
        confirmLabel: 'ยืนยันการแก้ไข',
        fields: [
          {
            name: 'remark',
            label: 'หมายเหตุการแก้ไข',
            placeholder: 'ระบุเหตุผลในการแก้ไข',
            required: true,
            multiline: true,
          },
        ],
      },
      async (values) => {
        const remark = values.remark?.trim()
        if (!remark) {
          throw new Error('กรุณาระบุหมายเหตุการแก้ไข')
        }
        await submitUpdateQuotation(quotationData, remark)
      }
    )
  }

  // ลบใบเสนอราคา
  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
        credentials: 'include',
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
        credentials: 'include',
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

  const submitIssueSalesOrder = async (
    quotation: Quotation,
    remark: string
  ) => {
    const resolvedSalesOrderNumber =
      quotation.salesOrderNumber?.trim() || buildSalesOrderNumber(quotation._id)
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ remark }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({} as any))
        throw new Error(err?.error || 'เกิดข้อผิดพลาดในการออกใบสั่งขาย')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ใบสั่งขาย_${resolvedSalesOrderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      await fetchQuotations()
      toast.success('ออกใบสั่งขายและดาวน์โหลด PDF เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error issuing sales order:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการออกใบสั่งขาย')
      throw error
    }
  }

  // ออกใบสั่งขายจากใบเสนอราคา (ดาวน์โหลด PDF และทำเครื่องหมายว่าออกแล้ว)
  const handleIssueSalesOrder = async (quotation: Quotation) => {
    const resolvedSalesOrderNumber =
      quotation.salesOrderNumber?.trim() || buildSalesOrderNumber(quotation._id)
    openPrompt(
      {
        title: 'ออกใบสั่งขาย',
        description: `ระบบจะสร้างเลขที่ใบสั่งขายอัตโนมัติ: ${resolvedSalesOrderNumber}`,
        confirmLabel: 'ออกใบสั่งขาย',
        fields: [
          {
            name: 'remark',
            label: 'หมายเหตุการออกใบสั่งขาย',
            placeholder: 'ระบุหมายเหตุเพิ่มเติม',
            required: true,
            multiline: true,
          },
        ],
      },
      async (values) => {
        const remark = values.remark?.trim()
        if (!remark) {
          throw new Error('กรุณาระบุหมายเหตุการออกใบสั่งขาย')
        }
        await submitIssueSalesOrder(quotation, remark)
      }
    )
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
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-yellow-100 text-yellow-800'
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

  const submitChangeStatus = async (
    quotation: Quotation,
    newStatus: Quotation['status'],
    notes?: string
  ) => {
    try {
      setChangingStatusId(quotation._id)
      const res = await fetch(`/api/quotations/${quotation._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, ...(notes ? { notes } : {}) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'เปลี่ยนสถานะไม่สำเร็จ')
      }
      await fetchQuotations()
      toast.success('เปลี่ยนสถานะเรียบร้อยแล้ว')
    } catch (e) {
      console.error('Error changing quotation status:', e)
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
      throw e
    } finally {
      setChangingStatusId('')
    }
  }

  // เปลี่ยนสถานะใบเสนอราคา
  const handleChangeStatus = async (quotation: Quotation, newStatus: Quotation['status']) => {
    if (quotation.status === newStatus) return

    if (newStatus === 'accepted' || newStatus === 'rejected') {
      openPrompt(
        {
          title: `หมายเหตุสถานะ: ${getStatusLabel(newStatus)}`,
          description: 'กรุณาระบุหมายเหตุก่อนเปลี่ยนสถานะ',
          confirmLabel: 'ยืนยันการเปลี่ยนสถานะ',
          fields: [
            {
              name: 'notes',
              label: 'หมายเหตุ',
              placeholder: 'ระบุเหตุผลหรือรายละเอียดเพิ่มเติม',
              required: true,
              multiline: true,
            },
          ],
        },
        async (values) => {
          const notes = values.notes?.trim()
          if (!notes) {
            throw new Error('กรุณาระบุหมายเหตุ')
          }
          await submitChangeStatus(quotation, newStatus, notes)
        }
      )
      return
    }

    await submitChangeStatus(quotation, newStatus)
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md border-gray-300 bg-white"
                title="กรองตามสถานะ"
              >
                <option value="">ทุกสถานะ</option>
                <option value="draft">ร่าง</option>
                <option value="sent">ส่งแล้ว</option>
                <option value="accepted">ยอมรับ</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="expired">หมดอายุ</option>
              </select>
              <button
                onClick={() => fetchQuotations()}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
              >
                กรอง
              </button>
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
            onClose={editingQuotation ? handleCancelEdit : handleCancelCreate}
            isEditing={!!editingQuotation}
            loading={formLoading}
            embedded
          />
        </AdminModal>

        {promptConfig && (
          <AdminModal
            isOpen={!!promptConfig}
            onClose={closePrompt}
            maxWidth="max-w-lg"
            maxHeight="max-h-[90vh]"
          >
            <form onSubmit={handlePromptSubmit} className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{promptConfig.title}</h2>
                {promptConfig.description && (
                  <p className="text-sm text-gray-600 mt-1">{promptConfig.description}</p>
                )}
              </div>

              <div className="space-y-4">
                {promptConfig.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {field.multiline ? (
                      <Textarea
                        value={promptValues[field.name] || ''}
                        onChange={(e) => handlePromptValueChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        value={promptValues[field.name] || ''}
                        onChange={(e) => handlePromptValueChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              {promptError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {promptError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePrompt}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  {promptConfig.cancelLabel || 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  disabled={promptSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {promptSubmitting
                    ? 'กำลังบันทึก...'
                    : promptConfig.confirmLabel || 'ยืนยัน'}
                </button>
              </div>
            </form>
          </AdminModal>
        )}

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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                            {getStatusLabel(quotation.status)}
                          </span>
                          <select
                            value={quotation.status}
                            onChange={(e) => handleChangeStatus(quotation, e.target.value as Quotation['status'])}
                            disabled={changingStatusId === quotation._id}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            title="เปลี่ยนสถานะ"
                          >
                            <option value="draft">ร่าง</option>
                            <option value="sent">ส่งแล้ว</option>
                            <option value="accepted">ยอมรับ</option>
                            <option value="rejected">ปฏิเสธ</option>
                            <option value="expired">หมดอายุ</option>
                          </select>
                        </div>
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
                          {quotation.status === 'draft' && (
                            <button
                              onClick={() => handleSendViaLine(quotation)}
                              className={`text-blue-700 hover:text-blue-900 transition-colors ${sendingId===quotation._id ? 'opacity-50 pointer-events-none' : ''}`}
                              title="ส่งผ่าน LINE"
                            >
                              ส่งผ่าน LINE
                            </button>
                          )}
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
                          <button
                            onClick={() => handleIssueSalesOrder(quotation)}
                            className="text-purple-700 hover:text-purple-900 transition-colors"
                          >
                            ออกใบสั่งขาย (PDF)
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
