'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface SalesOrderItem {
  name?: string
  description?: string
  quantity?: number
  unitLabel?: string
  unitPrice?: number
  discount?: number
  amount?: number
}

interface SalesOrder {
  _id: string
  salesOrderNumber?: string
  customerName: string
  customerPhone?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  orderDate?: string
  paymentTerms?: string
  deliveryAddress?: string
  deliveryProvince?: string
  deliveryDistrict?: string
  deliverySubdistrict?: string
  deliveryPostalCode?: string
  items: SalesOrderItem[]
  subtotal?: number
  vatRate?: number
  vatAmount?: number
  totalAmount?: number
  notes?: string
  ownerId?: string
}

export default function SalesOrderView() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [companyInfo, setCompanyInfo] = useState<any | null>(null)
  const [signature, setSignature] = useState<{ name?: string; position?: string; signatureUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchSignature = async (userId: string) => {
      try {
        const response = await fetch(`/api/users/signature?userId=${userId}`, { credentials: 'include' })
        if (!response.ok) return
        const data = await response.json()
        if (active && data?.success && data?.user) {
          setSignature({
            name: data.user.name,
            position: data.user.position,
            signatureUrl: data.user.signatureUrl,
          })
        }
      } catch (err) {
        console.error('Error fetching signature:', err)
      }
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`, { credentials: 'include' })
        if (!response.ok) throw new Error('ไม่พบใบสั่งขาย')
        const data = await response.json()
        if (active) {
          setOrder(data)
          if (data?.ownerId) {
            fetchSignature(data.ownerId)
          } else {
            setSignature(null)
          }
        }
      } catch (err) {
        console.error('Error fetching sales order:', err)
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งขาย')
      } finally {
        setLoading(false)
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', { credentials: 'include' })
        if (!response.ok) return
        const data = await response.json()
        if (active) setCompanyInfo(data)
      } catch (err) {
        console.error('Error fetching settings:', err)
      }
    }

    if (orderId) {
      fetchOrder()
      fetchSettings()
    }

    return () => {
      active = false
    }
  }, [orderId])

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)

  const shippingAddress = order
    ? [
        order.deliveryAddress,
        order.deliverySubdistrict ? `ต.${order.deliverySubdistrict}` : '',
        order.deliveryDistrict ? `อ.${order.deliveryDistrict}` : '',
        order.deliveryProvince ? `จ.${order.deliveryProvince}` : '',
        order.deliveryPostalCode || '',
      ]
        .filter(Boolean)
        .join(' ')
    : ''

  const itemsSubtotal = order
    ? order.items.reduce((sum, item) => {
        const unitPrice = Number(item.unitPrice ?? (item as any).price ?? 0)
        const discount = Number(item.discount ?? 0)
        const quantity = Number(item.quantity ?? 0)
        const amount = Number(item.amount ?? (unitPrice - discount) * quantity)
        return sum + amount
      }, 0)
    : 0
  const subtotal = order ? Number(order.subtotal ?? itemsSubtotal) : 0
  const vatRate = order ? Number(order.vatRate ?? 7) : 7
  const vatAmount = order ? Number(order.vatAmount ?? (subtotal * vatRate) / 100) : 0
  const totalAmount = order ? Number(order.totalAmount ?? subtotal + vatAmount) : 0

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/pdf`, { credentials: 'include' })
      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการสร้าง PDF')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ใบสั่งขาย_${order?.salesOrderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('ดาวน์โหลด PDF เรียบร้อยแล้ว')
    } catch (err) {
      console.error('Error downloading PDF:', err)
      toast.error('เกิดข้อผิดพลาดในการดาวน์โหลด PDF')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'ไม่พบข้อมูลใบสั่งขาย'}</p>
          <Button className="mt-4" onClick={() => router.push('/adminb2b/sales-orders')}>
            กลับไปหน้ารายการ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
        <div className="p-6 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.push('/adminb2b/sales-orders')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปหน้ารายการ
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">ใบสั่งขาย</h1>
            <p className="text-gray-600">เลขที่: {order.salesOrderNumber || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">ข้อมูลบริษัท</h3>
              <p className="text-sm text-gray-700">{companyInfo?.companyName || 'บริษัท วินริช ไดนามิก จำกัด'}</p>
              <p className="text-sm text-gray-700">{companyInfo?.companyAddress || '-'}</p>
              <p className="text-sm text-gray-700">โทร {companyInfo?.companyPhone || '-'}</p>
              <p className="text-sm text-gray-700">อีเมล {companyInfo?.companyEmail || '-'}</p>
              <p className="text-sm text-gray-700">เลขผู้เสียภาษี {companyInfo?.taxId || '-'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">ข้อมูลลูกค้า</h3>
              <p className="text-sm text-gray-700">{order.customerName}</p>
              <p className="text-sm text-gray-700">โทร {order.customerPhone || '-'}</p>
              <p className="text-sm text-gray-700">ที่อยู่จัดส่ง {shippingAddress || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">วันที่</h3>
              <p className="text-sm text-gray-700">{formatDate(order.orderDate)}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">เงื่อนไขชำระเงิน</h3>
              <p className="text-sm text-gray-700">{order.paymentTerms || '-'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">หมายเหตุ</h3>
              <p className="text-sm text-gray-700">{order.notes || '-'}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">รายการสินค้า</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-sm">ลำดับ</th>
                    <th className="border px-3 py-2 text-sm text-left">รายการ</th>
                    <th className="border px-3 py-2 text-sm">จำนวน</th>
                    <th className="border px-3 py-2 text-sm">หน่วย</th>
                    <th className="border px-3 py-2 text-sm">ราคา/หน่วย</th>
                    <th className="border px-3 py-2 text-sm">ส่วนลด</th>
                    <th className="border px-3 py-2 text-sm">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    const unitPrice = Number(item.unitPrice ?? (item as any).price ?? 0)
                    const discount = Number(item.discount ?? 0)
                    const quantity = Number(item.quantity ?? 0)
                    const amount = Number(item.amount ?? (unitPrice - discount) * quantity)
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-center text-sm">{index + 1}</td>
                        <td className="border px-3 py-2 text-sm">{item.name || item.description || '-'}</td>
                        <td className="border px-3 py-2 text-center text-sm">{quantity}</td>
                        <td className="border px-3 py-2 text-center text-sm">{item.unitLabel || '-'}</td>
                        <td className="border px-3 py-2 text-right text-sm">{formatCurrency(unitPrice)}</td>
                        <td className="border px-3 py-2 text-right text-sm">{formatCurrency(discount)}</td>
                        <td className="border px-3 py-2 text-right text-sm">{formatCurrency(amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ยอดรวม</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT {vatRate}%</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>ยอดรวมทั้งหมด</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-center">พนักงานขาย</h3>
              <div className="h-20 flex items-end justify-center">
                {signature?.signatureUrl ? (
                  <img src={signature.signatureUrl} alt="signature" className="max-h-16" />
                ) : (
                  <div className="text-sm text-gray-400">ไม่มีลายเซ็น</div>
                )}
              </div>
              <p className="text-sm text-center mt-2">{signature?.name || '-'}</p>
              <p className="text-xs text-center text-gray-500">{signature?.position || '-'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-center">ผู้อนุมัติ</h3>
              <div className="h-20 flex items-end justify-center text-sm text-gray-400">-</div>
              <p className="text-sm text-center mt-2">-</p>
              <p className="text-xs text-center text-gray-500">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
