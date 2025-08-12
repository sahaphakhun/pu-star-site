'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import CustomerForm from '@/components/CustomerForm'
import CustomerList, { Customer as ListCustomer } from '@/components/CustomerList'

interface Customer {
  _id: string
  name: string
  phoneNumber: string
  email?: string
  taxId?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  customerType: 'new' | 'regular' | 'target' | 'inactive'
  assignedTo?: string
  creditLimit?: number
  paymentTerms: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminB2BCustomers() {
  const [customers, setCustomers] = useState<ListCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<ListCustomer | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // ดึงข้อมูลลูกค้าทั้งหมด
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า')
      }
      const data = await response.json()
      setCustomers(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า')
    } finally {
      setLoading(false)
    }
  }

  // สร้างลูกค้าใหม่
  const handleCreateCustomer = async (customerData: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการสร้างลูกค้า')
      }

      await fetchCustomers()
      setShowForm(false)
      toast.success('สร้างลูกค้าใหม่เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างลูกค้า')
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  // อัพเดทลูกค้า
  const handleUpdateCustomer = async (customerData: any) => {
    if (!editingCustomer) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดทลูกค้า')
      }

      await fetchCustomers()
      setEditingCustomer(null)
      toast.success('อัพเดทข้อมูลลูกค้าเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดทลูกค้า')
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  // ลบลูกค้า
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการลบลูกค้า')
      }

      await fetchCustomers()
      toast.success('ลบลูกค้าเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบลูกค้า')
      throw error
    }
  }

  // แก้ไขลูกค้า
  const handleEditCustomer = (customer: ListCustomer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  // ยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingCustomer(null)
    setShowForm(false)
  }

  // ยกเลิกการสร้างใหม่
  const handleCancelCreate = () => {
    setShowForm(false)
  }

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการลูกค้า</h1>
              <p className="text-gray-600 mt-2">
                จัดการข้อมูลลูกค้า เพิ่ม แก้ไข ลบ และค้นหา
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                เพิ่มลูกค้าใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Customer Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <CustomerForm
                  initialData={editingCustomer ? {
                    name: editingCustomer.name,
                    phoneNumber: editingCustomer.phoneNumber,
                    email: editingCustomer.email || '',
                    taxId: editingCustomer.taxId || '',
                    companyName: editingCustomer.companyName || '',
                    companyAddress: editingCustomer.companyAddress || '',
                    companyPhone: editingCustomer.companyPhone || '',
                    companyEmail: editingCustomer.companyEmail || '',
                    customerType: editingCustomer.customerType,
                    assignedTo: editingCustomer.assignedTo || '',
                    creditLimit: editingCustomer.creditLimit !== undefined ? String(editingCustomer.creditLimit) : '',
                    paymentTerms: editingCustomer.paymentTerms,
                    notes: editingCustomer.notes || '',
                    isActive: editingCustomer.isActive,
                  } : undefined}
                  onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                  onCancel={editingCustomer ? handleCancelEdit : handleCancelCreate}
                  isEditing={!!editingCustomer}
                  loading={formLoading}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer List */}
        <CustomerList
          customers={customers}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          onRefresh={fetchCustomers}
          loading={loading}
        />
      </div>
    </div>
  )
}


