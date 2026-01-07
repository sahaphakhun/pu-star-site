"use client"

import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Upload, Star, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import useApiService from '@/features/jubili/hooks/useApiService'

interface OrderItem {
  description: string
  quantity: number
  unit: string
  pricePerUnit: number
  discount: number
  amount: number
}

interface SalesOrder {
  id?: string
  salesOrderNumber: string
  quotationId: string
  customerId: string
  customerName: string
  orderDate: string
  deliveryDate: string
  importance: number
  owner: string
  team: string
  contactName: string
  contactEmail: string
  contactPhone: string
  deliveryMethod: string
  deliveryStatus: string
  trackingNumber: string
  deliveryAddress: string
  deliveryProvince: string
  deliveryDistrict: string
  deliverySubdistrict: string
  deliveryPostalCode: string
  shipToSameAsCustomer: boolean
  items: OrderItem[]
  subtotal: number
  vat: number
  vatAmount: number
  total: number
  paymentStatus: string
  paidAmount: number
  remainingAmount: number
  paymentTerms: string
  paymentDueDate: string
  notes: string
  internalNotes: string
  status: string
  createdAt?: string
  updatedAt?: string
}

interface SalesOrderFormProps {
  salesOrder?: SalesOrder
  onClose: () => void
  onSave?: () => void
}

export default function SalesOrderForm({ salesOrder, onClose, onSave }: SalesOrderFormProps) {
  const { customers: customersApi, quotations: quotationsApi, salesOrders: salesOrdersApi } = useApiService()
  const [customers, setCustomers] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [admins, setAdmins] = useState<Array<{ _id: string; name?: string; phone?: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const mapApiStatusToUi = (status?: string) => {
    const map: Record<string, SalesOrder['status']> = {
      pending: 'draft',
      confirmed: 'confirmed',
      ready: 'processing',
      shipped: 'processing',
      delivered: 'completed',
      cancelled: 'cancelled',
    }
    return map[String(status || '')] || 'draft'
  }

  const resolveDeliveryStatus = (order: any) => {
    if (order?.deliveryStatus) return order.deliveryStatus
    if (order?.status === 'delivered') return 'delivered'
    if (order?.status === 'shipped') return 'shipped'
    if (order?.status === 'ready') return 'preparing'
    return 'pending'
  }

  const buildEmptyForm = (): SalesOrder => ({
    // ข้อมูลพื้นฐาน
    salesOrderNumber: '',
    quotationId: '',
    customerId: '',
    customerName: '',

    // วันที่
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',

    // ผู้รับผิดชอบ
    importance: 3,
    owner: '',
    team: 'PU STAR Office',

    // ข้อมูลผู้ติดต่อ
    contactName: '',
    contactEmail: '',
    contactPhone: '',

    // ข้อมูลการจัดส่ง
    deliveryMethod: 'รับเอง',
    deliveryStatus: 'pending', // pending, preparing, shipped, delivered
    trackingNumber: '',

    // ที่อยู่จัดส่ง
    deliveryAddress: '',
    deliveryProvince: '',
    deliveryDistrict: '',
    deliverySubdistrict: '',
    deliveryPostalCode: '',
    shipToSameAsCustomer: true,

    // รายการสินค้า
    items: [
      { description: '', quantity: 0, unit: '', pricePerUnit: 0, discount: 0, amount: 0 },
    ],

    // สรุปยอด
    subtotal: 0,
    vat: 7,
    vatAmount: 0,
    total: 0,

    // การชำระเงิน
    paymentStatus: 'unpaid', // unpaid, partial, paid
    paidAmount: 0,
    remainingAmount: 0,
    paymentTerms: '',
    paymentDueDate: '',

    // หมายเหตุ
    notes: '',
    internalNotes: '',

    // สถานะ
    status: 'draft', // draft, confirmed, processing, completed, cancelled
  })

  const mapOrderToForm = (order: any): SalesOrder => {
    const items = Array.isArray(order?.items)
      ? order.items.map((item: any) => {
        const pricePerUnit = Number(item.unitPrice ?? item.price ?? 0)
        const quantity = Number(item.quantity ?? 0)
        const discount = Number(item.discount ?? 0)
        const amount = Number(item.amount ?? (pricePerUnit - discount) * quantity)
        return {
          description: item.description || item.name || '',
          quantity,
          unit: item.unitLabel || '',
          pricePerUnit,
          discount,
          amount,
        }
      })
      : []

    const subtotal = Number(order?.subtotal ?? items.reduce((sum, item) => sum + (item.amount || 0), 0))
    const vat = Number(order?.vatRate ?? order?.vat ?? 7)
    const vatAmount = Number(order?.vatAmount ?? (subtotal * vat) / 100)
    const total = Number(order?.totalAmount ?? subtotal + vatAmount)
    const paidAmount = Number(order?.paidAmount ?? 0)
    const remainingAmount = Number(order?.remainingAmount ?? Math.max(total - paidAmount, 0))
    const hasShipping = Boolean(
      order?.deliveryAddress ||
        order?.deliveryProvince ||
        order?.deliveryDistrict ||
        order?.deliverySubdistrict ||
        order?.deliveryPostalCode
    )

    return {
      salesOrderNumber: order?.salesOrderNumber || '',
      quotationId: order?.quotationId || order?.sourceQuotationId || '',
      customerId: order?.customerId || '',
      customerName: order?.customerName || '',
      orderDate: order?.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryDate: order?.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
      importance: Number(order?.importance ?? 3),
      owner: order?.ownerId || '',
      team: order?.team || 'PU STAR Office',
      contactName: order?.contactName || '',
      contactEmail: order?.contactEmail || '',
      contactPhone: order?.contactPhone || order?.customerPhone || '',
      deliveryMethod: order?.deliveryMethod || 'รับเอง',
      deliveryStatus: resolveDeliveryStatus(order),
      trackingNumber: order?.trackingNumber || '',
      deliveryAddress: order?.deliveryAddress || '',
      deliveryProvince: order?.deliveryProvince || '',
      deliveryDistrict: order?.deliveryDistrict || '',
      deliverySubdistrict: order?.deliverySubdistrict || '',
      deliveryPostalCode: order?.deliveryPostalCode || '',
      shipToSameAsCustomer: order?.shipToSameAsCustomer ?? !hasShipping,
      items: items.length ? items : [{ description: '', quantity: 0, unit: '', pricePerUnit: 0, discount: 0, amount: 0 }],
      subtotal,
      vat,
      vatAmount,
      total,
      paymentStatus: order?.paymentStatus || (order?.slipVerification?.verified ? 'paid' : 'unpaid'),
      paidAmount,
      remainingAmount,
      paymentTerms: order?.paymentTerms || '',
      paymentDueDate: order?.paymentDueDate ? new Date(order.paymentDueDate).toISOString().split('T')[0] : '',
      notes: order?.notes || '',
      internalNotes: order?.internalNotes || '',
      status: mapApiStatusToUi(order?.status),
      createdAt: order?.createdAt,
      updatedAt: order?.updatedAt,
    }
  }

  const [formData, setFormData] = useState<SalesOrder>(() => (
    salesOrder ? mapOrderToForm(salesOrder) : buildEmptyForm()
  ))

  useEffect(() => {
    setFormData(salesOrder ? mapOrderToForm(salesOrder) : buildEmptyForm())
  }, [salesOrder])

  useEffect(() => {
    let active = true
    const loadLookups = async () => {
      try {
        const [customersRes, quotationsRes] = await Promise.all([
          customersApi.getCustomers({ page: 1, limit: 200 }),
          quotationsApi.getQuotations({ page: 1, limit: 200 }),
        ])
        if (!active) return
        const customerList = Array.isArray(customersRes) ? customersRes : customersRes.data || []
        const quotationList = Array.isArray(quotationsRes) ? quotationsRes : quotationsRes.data || []
        setCustomers(customerList)
        setQuotations(quotationList)
      } catch {
        if (active) {
          setCustomers([])
          setQuotations([])
        }
      }
    }

    const loadAdmins = async () => {
      try {
        const res = await fetch('/api/adminb2b/admins', { credentials: 'include' })
        const data = await res.json()
        if (!active) return
        if (data?.success && Array.isArray(data.data)) {
          setAdmins(data.data)
        } else {
          setAdmins([])
        }
      } catch {
        if (active) setAdmins([])
      }
    }

    loadLookups()
    loadAdmins()
    return () => {
      active = false
    }
  }, [customersApi, quotationsApi])

  const applyCustomerShipping = (next: SalesOrder, customer?: any) => {
    if (!customer) return
    next.deliveryAddress = customer.companyAddress || customer.shippingAddress || ''
    next.deliveryProvince = customer.province || ''
    next.deliveryDistrict = customer.district || ''
    next.deliverySubdistrict = customer.subdistrict || ''
    next.deliveryPostalCode = customer.zipcode || ''
  }

  const applyQuotationShipping = (next: SalesOrder, quotation?: any) => {
    if (!quotation) return
    const shipSame = quotation.shipToSameAsCustomer ?? next.shipToSameAsCustomer
    next.shipToSameAsCustomer = Boolean(shipSame)
    next.deliveryAddress = shipSame
      ? quotation.customerAddress || quotation.shippingAddress || ''
      : quotation.shippingAddress || quotation.customerAddress || ''
    next.deliveryProvince = quotation.deliveryProvince || ''
    next.deliveryDistrict = quotation.deliveryDistrict || ''
    next.deliverySubdistrict = quotation.deliverySubdistrict || ''
    next.deliveryPostalCode = quotation.deliveryZipcode || quotation.deliveryPostalCode || ''
  }

  const handleChange = (field: keyof SalesOrder, value: any) => {
    setFormData((prev: SalesOrder) => {
      const next: SalesOrder = { ...prev, [field]: value }

      if (field === 'quotationId' && value) {
        const quotation = quotations.find((q: any) => String(q._id || q.id) === String(value)) as any
        if (quotation) {
          const mappedItems = (quotation.items || []).map((item: any) => {
            const pricePerUnit = Number(item.unitPrice ?? 0)
            const quantity = Number(item.quantity ?? 0)
            const discount = Number(item.discount ? (pricePerUnit * item.discount) / 100 : 0)
            return {
              description: item.productName || item.description || '',
              quantity,
              unit: item.unit || '',
              pricePerUnit,
              discount,
              amount: (pricePerUnit - discount) * quantity,
            }
          })
          const subtotal = Number(quotation.totalAmount ?? 0)
          const vatRate = Number(quotation.vatRate ?? 7)
          const vatAmount = Number(quotation.vatAmount ?? (subtotal * vatRate) / 100)
          const total = Number(quotation.grandTotal ?? subtotal + vatAmount)

          next.customerId = quotation.customerId || ''
          next.customerName = quotation.customerName || ''
          next.contactPhone = quotation.customerPhone || ''
          next.items = mappedItems.length ? mappedItems : next.items
          next.subtotal = subtotal
          next.vat = vatRate
          next.vatAmount = vatAmount
          next.total = total
          next.remainingAmount = Math.max(total - Number(next.paidAmount || 0), 0)
          next.paymentTerms = quotation.paymentTerms || next.paymentTerms
          applyQuotationShipping(next, quotation)
        }
      }

      if (field === 'customerId' && value) {
        const customer = customers.find((c: any) => String(c._id || c.id) === String(value))
        if (customer) {
          next.customerName = customer.name || ''
          next.contactPhone = customer.phoneNumber || ''
          if (next.shipToSameAsCustomer) {
            applyCustomerShipping(next, customer)
          }
        }
      }

      if (field === 'shipToSameAsCustomer') {
        if (value) {
          const customer = customers.find((c: any) => String(c._id || c.id) === String(next.customerId))
          applyCustomerShipping(next, customer)
        }
      }

      if (field === 'paidAmount') {
        const remaining = Number(next.total || 0) - Number(value || 0)
        const status = remaining <= 0 ? 'paid' : Number(value || 0) > 0 ? 'partial' : 'unpaid'
        next.remainingAmount = Math.max(remaining, 0)
        next.paymentStatus = status
      }

      return next
    })
  }

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items]
    ;(newItems[index] as any)[field] = value
    
    // Auto calculate
    const item = newItems[index]
    if (field === 'quantity' || field === 'pricePerUnit' || field === 'discount') {
      item.amount = (item.pricePerUnit - item.discount) * item.quantity
    }
    
    setFormData({ ...formData, items: newItems })
    calculateTotals(newItems)
  }

  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const vatAmount = (subtotal * formData.vat) / 100
    const total = subtotal + vatAmount
    const remaining = total - formData.paidAmount
    
    setFormData((prev: any) => ({
      ...prev,
      subtotal,
      vatAmount,
      total,
      remainingAmount: remaining,
    }))
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 0, unit: '', pricePerUnit: 0, discount: 0, amount: 0 }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
    calculateTotals(newItems)
  }

  const mapUiStatusToApi = (status: SalesOrder['status']) => {
    const map: Record<string, string> = {
      draft: 'pending',
      confirmed: 'confirmed',
      processing: 'ready',
      completed: 'delivered',
      cancelled: 'cancelled',
    }
    return map[status] || 'pending'
  }

  const handleSubmit = async (e: React.FormEvent, action = 'draft') => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const status: SalesOrder['status'] = action === 'confirm' ? 'confirmed' : 'draft'
      const selectedCustomer = customers.find((c: any) => String(c._id || c.id) === String(formData.customerId))
      const customerPhone = formData.contactPhone || selectedCustomer?.phoneNumber || ''

      if (!formData.customerName || !customerPhone) {
        throw new Error('กรุณาระบุชื่อลูกค้าและเบอร์ติดต่อให้ครบถ้วน')
      }

      const items = (formData.items || [])
        .filter((item) => item.description && Number(item.quantity || 0) > 0)
        .map((item) => ({
          productId: (item as any).productId || undefined,
          name: item.description,
          description: item.description,
          quantity: Number(item.quantity || 0),
          unitLabel: item.unit || undefined,
          unitPrice: Number(item.pricePerUnit || 0),
          price: Number(item.pricePerUnit || 0),
          discount: Number(item.discount || 0),
          amount: Number(item.amount || 0),
        }))

      if (!items.length) {
        throw new Error('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ')
      }

      const payload: any = {
        orderType: 'sales_order',
        salesOrderNumber: formData.salesOrderNumber || `SO${Date.now()}`,
        quotationId: formData.quotationId || undefined,
        customerId: formData.customerId || undefined,
        customerName: formData.customerName,
        customerPhone,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        orderDate: formData.orderDate || undefined,
        deliveryDate: formData.deliveryDate || undefined,
        deliveryStatus: formData.deliveryStatus || undefined,
        deliveryMethod: formData.deliveryMethod || undefined,
        trackingNumber: formData.trackingNumber || undefined,
        deliveryAddress: formData.deliveryAddress || undefined,
        deliveryProvince: formData.deliveryProvince || undefined,
        deliveryDistrict: formData.deliveryDistrict || undefined,
        deliverySubdistrict: formData.deliverySubdistrict || undefined,
        deliveryPostalCode: formData.deliveryPostalCode || undefined,
        importance: Number(formData.importance || 0),
        ownerId: formData.owner || undefined,
        team: formData.team || undefined,
        paymentStatus: formData.paymentStatus || undefined,
        paidAmount: Number(formData.paidAmount || 0),
        remainingAmount: Number(formData.remainingAmount || 0),
        paymentTerms: formData.paymentTerms || undefined,
        paymentDueDate: formData.paymentDueDate || undefined,
        notes: formData.notes || undefined,
        internalNotes: formData.internalNotes || undefined,
        subtotal: Number(formData.subtotal || 0),
        vatRate: Number(formData.vat || 0),
        vatAmount: Number(formData.vatAmount || 0),
        totalAmount: Number(formData.total || 0),
        status: mapUiStatusToApi(status),
        items,
      }

      const orderId = (salesOrder as any)?._id || salesOrder?.id
      if (orderId) {
        await salesOrdersApi.updateSalesOrder(String(orderId), payload)
      } else {
        await salesOrdersApi.createSalesOrder(payload)
      }

      if (onSave) onSave()
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกใบสั่งขาย')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deliveryStatusConfig = {
    pending: { label: 'รอจัดเตรียม', color: 'bg-gray-100 text-gray-800' },
    preparing: { label: 'กำลังจัดเตรียม', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'จัดส่งแล้ว', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'ส่งถึงแล้ว', color: 'bg-green-100 text-green-800' },
  }

  const paymentStatusConfig = {
    unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-800' },
    partial: { label: 'ชำระบางส่วน', color: 'bg-orange-100 text-orange-800' },
    paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
  }

  const shippingSummary = [
    formData.deliveryAddress,
    formData.deliverySubdistrict ? `ต.${formData.deliverySubdistrict}` : '',
    formData.deliveryDistrict ? `อ.${formData.deliveryDistrict}` : '',
    formData.deliveryProvince ? `จ.${formData.deliveryProvince}` : '',
    formData.deliveryPostalCode || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Package size={28} />
            <div>
              <h2 className="text-xl font-semibold">
                {salesOrder ? 'แก้ไขใบสั่งขาย' : 'สร้างใบสั่งขาย'}
              </h2>
              {formData.salesOrderNumber && (
                <p className="text-sm opacity-90">{formData.salesOrderNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">
              THB {formData.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
            <Button variant="ghost" onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <form className="flex-1 overflow-y-auto">
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {/* Status Badges */}
            <div className="flex gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-600 mr-2">สถานะการจัดส่ง:</span>
                <Badge className={deliveryStatusConfig[formData.deliveryStatus as keyof typeof deliveryStatusConfig]?.color}>
                  {deliveryStatusConfig[formData.deliveryStatus as keyof typeof deliveryStatusConfig]?.label}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600 mr-2">สถานะการชำระเงิน:</span>
                <Badge className={paymentStatusConfig[formData.paymentStatus as keyof typeof paymentStatusConfig]?.color}>
                  {paymentStatusConfig[formData.paymentStatus as keyof typeof paymentStatusConfig]?.label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลคำสั่งซื้อ</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ใบเสนอราคาอ้างอิง
                      </label>
                      <Select value={formData.quotationId} onValueChange={(value) => handleChange('quotationId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกใบเสนอราคา (ถ้ามี)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">เลือกใบเสนอราคา (ถ้ามี)</SelectItem>
                          {quotations.map((quotation: any) => (
                            <SelectItem key={quotation._id || quotation.id} value={quotation._id || quotation.id}>
                              {quotation.quotationNumber || quotation._id} - {quotation.customerName || '-'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ชื่อลูกค้า <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.customerId} onValueChange={(value) => handleChange('customerId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="โปรดเลือกลูกค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">โปรดเลือกลูกค้า</SelectItem>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer._id || customer.id} value={customer._id || customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันที่สั่งซื้อ
                      </label>
                      <Input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => handleChange('orderDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันที่จัดส่ง
                      </label>
                      <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleChange('deliveryDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ความสำคัญ
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleChange('importance', star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={24}
                              className={`${
                                star <= formData.importance
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ผู้รับผิดชอบ
                      </label>
                      <Select value={formData.owner} onValueChange={(value) => handleChange('owner', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">ไม่ระบุ</SelectItem>
                          {admins.map((admin) => (
                            <SelectItem key={admin._id} value={admin._id}>
                              {admin.name || admin.phone || admin._id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลการจัดส่ง</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        สถานะการจัดส่ง
                      </label>
                      <Select value={formData.deliveryStatus} onValueChange={(value) => handleChange('deliveryStatus', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">รอจัดเตรียม</SelectItem>
                          <SelectItem value="preparing">กำลังจัดเตรียม</SelectItem>
                          <SelectItem value="shipped">จัดส่งแล้ว</SelectItem>
                          <SelectItem value="delivered">ส่งถึงแล้ว</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วิธีการจัดส่ง
                      </label>
                      <Select value={formData.deliveryMethod} onValueChange={(value) => handleChange('deliveryMethod', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="รับเอง">รับเอง</SelectItem>
                          <SelectItem value="จัดส่ง - Kerry Express">จัดส่ง - Kerry Express</SelectItem>
                          <SelectItem value="จัดส่ง - Flash Express">จัดส่ง - Flash Express</SelectItem>
                          <SelectItem value="จัดส่ง - Thailand Post">จัดส่ง - Thailand Post</SelectItem>
                          <SelectItem value="จัดส่ง - รถบริษัท">จัดส่ง - รถบริษัท</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        เลขพัสดุ (Tracking Number)
                      </label>
                      <Input
                        value={formData.trackingNumber}
                        onChange={(e) => handleChange('trackingNumber', e.target.value)}
                        placeholder="กรอกเลขพัสดุ"
                      />
                    </div>

                    <div>
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.shipToSameAsCustomer}
                          onChange={(e) => handleChange('shipToSameAsCustomer', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">ที่อยู่เดียวกับลูกค้า</span>
                      </label>
                      <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {shippingSummary || 'ยังไม่มีที่อยู่ลูกค้า'}
                      </div>
                    </div>

                    {!formData.shipToSameAsCustomer && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            ที่อยู่จัดส่ง
                          </label>
                          <Textarea
                            value={formData.deliveryAddress}
                            onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                            rows={3}
                            placeholder="ที่อยู่จัดส่ง"
                          />
                        </div>

                        <AddressAutocomplete
                          value={{
                            province: formData.deliveryProvince,
                            district: formData.deliveryDistrict,
                            subdistrict: formData.deliverySubdistrict,
                            zipcode: formData.deliveryPostalCode,
                          }}
                          onChange={(address) => {
                            handleChange('deliveryProvince', address.province)
                            handleChange('deliveryDistrict', address.district)
                            handleChange('deliverySubdistrict', address.subdistrict)
                            handleChange('deliveryPostalCode', address.zipcode)
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลการชำระเงิน</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        เงื่อนไขการชำระเงิน
                      </label>
                      <Select value={formData.paymentTerms} onValueChange={(value) => handleChange('paymentTerms', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="โปรดเลือก" />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">โปรดเลือก</SelectItem>
                            <SelectItem value="เงินสด">เงินสด</SelectItem>
                            <SelectItem value="เก็บเงินปลายทาง (COD)">เก็บเงินปลายทาง (COD)</SelectItem>
                            <SelectItem value="เครดิต 7 วัน">เครดิต 7 วัน</SelectItem>
                            <SelectItem value="เครดิต 15 วัน">เครดิต 15 วัน</SelectItem>
                            <SelectItem value="เครดิต 30 วัน">เครดิต 30 วัน</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันครบกำหนดชำระ
                      </label>
                      <Input
                        type="date"
                        value={formData.paymentDueDate}
                        onChange={(e) => handleChange('paymentDueDate', e.target.value)}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>ยอดรวม</span>
                        <span className="font-semibold">
                          {formData.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VAT 7%</span>
                        <span className="font-semibold">
                          {formData.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>ยอดรวมทั้งหมด</span>
                        <span className="text-blue-600">
                          THB {formData.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="border-t pt-3">
                        <label className="block text-sm font-medium mb-1">
                          ยอดที่ชำระแล้ว
                        </label>
                        <Input
                          type="number"
                          value={formData.paidAmount}
                          onChange={(e) => handleChange('paidAmount', parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between text-lg font-bold text-red-600">
                        <span>คงเหลือ</span>
                        <span>
                          THB {formData.remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">หมายเหตุ</h3>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    placeholder="หมายเหตุสำหรับลูกค้า"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">รายการสินค้า</h3>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">ลำดับ</TableHead>
                      <TableHead className="text-sm">รายละเอียด</TableHead>
                      <TableHead className="text-sm">จำนวน</TableHead>
                      <TableHead className="text-sm">หน่วย</TableHead>
                      <TableHead className="text-sm">ราคา/หน่วย</TableHead>
                      <TableHead className="text-sm">ส่วนลด</TableHead>
                      <TableHead className="text-sm">มูลค่า</TableHead>
                      <TableHead className="text-sm"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            rows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-sm"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-sm"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                type="button"
                onClick={addItem}
                variant="primary"
                className="mt-4"
              >
                <Plus size={16} className="mr-2" /> เพิ่มรายการสินค้า
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              variant="secondary"
              disabled={submitting}
            >
              บันทึกร่าง
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'confirm')}
              variant="primary"
              disabled={submitting}
            >
              ยืนยันคำสั่งซื้อ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
