'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface QuotationItem {
  productName: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  totalPrice: number
  sku?: string
  selectedOptions?: Record<string, string>
}

interface Quotation {
  _id: string
  quotationNumber: string
  customerName: string
  customerTaxId?: string
  customerAddress?: string
  shippingAddress?: string
  deliveryProvince?: string
  deliveryDistrict?: string
  deliverySubdistrict?: string
  deliveryZipcode?: string
  shipToSameAsCustomer?: boolean
  customerPhone?: string
  subject: string
  validUntil: string
  paymentTerms: string
  deliveryTerms?: string
  items: QuotationItem[]
  vatRate: number
  subtotal: number
  totalDiscount: number
  totalAmount: number
  vatAmount: number
  grandTotal: number
  assignedTo?: string
  notes?: string
  status: string
  createdAt: string
}

export default function QuotationView() {
  const params = useParams()
  const quotationId = params.id as string
  
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [companyInfo, setCompanyInfo] = useState<any | null>(null)
  const [assigneeSignature, setAssigneeSignature] = useState<{
    name?: string
    position?: string
    signatureUrl?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ดึงข้อมูลใบเสนอราคา
  useEffect(() => {
    let active = true

    const fetchAssigneeSignature = async (userId: string) => {
      try {
        const response = await fetch(`/api/users/signature?userId=${userId}`, {
          credentials: 'include'
        })
        if (!response.ok) return
        const data = await response.json()
        if (active && data?.success && data?.user) {
          setAssigneeSignature({
            name: data.user.name,
            position: data.user.position,
            signatureUrl: data.user.signatureUrl
          })
        }
      } catch (error) {
        console.error('Error fetching assignee signature:', error)
      }
    }

    const fetchQuotation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/quotations/${quotationId}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('ไม่พบใบเสนอราคา')
        }
        
        const data = await response.json()
        if (active) {
          setQuotation(data)
          if (data?.assignedTo) {
            fetchAssigneeSignature(data.assignedTo)
          } else {
            setAssigneeSignature(null)
          }
        }
      } catch (error) {
        console.error('Error fetching quotation:', error)
        setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา')
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
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    if (quotationId) {
      fetchQuotation()
      fetchSettings()
    }

    return () => {
      active = false
    }
  }, [quotationId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/quotation/${quotationId}/pdf`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการสร้าง PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ใบเสนอราคา_${quotation?.quotationNumber}.pdf`
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

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'ไม่พบข้อมูลใบเสนอราคา'}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
          >
            กลับ
          </button>
        </div>
      </div>
    )
  }

  const formatAddressParts = (base: string | undefined, parts: string[]) => {
    const cleaned = parts.map((part) => part?.trim()).filter(Boolean) as string[]
    const suffix = cleaned.length ? ` ${cleaned.join(' ')}` : ''
    return `${base || ''}${suffix}`.trim()
  }

  const shippingAddress = quotation.shipToSameAsCustomer
    ? formatAddressParts(quotation.customerAddress, [
        quotation.deliverySubdistrict ? `ต.${quotation.deliverySubdistrict}` : '',
        quotation.deliveryDistrict ? `อ.${quotation.deliveryDistrict}` : '',
        quotation.deliveryProvince ? `จ.${quotation.deliveryProvince}` : '',
        quotation.deliveryZipcode || '',
      ])
    : formatAddressParts(quotation.shippingAddress, [
        quotation.deliverySubdistrict ? `ต.${quotation.deliverySubdistrict}` : '',
        quotation.deliveryDistrict ? `อ.${quotation.deliveryDistrict}` : '',
        quotation.deliveryProvince ? `จ.${quotation.deliveryProvince}` : '',
        quotation.deliveryZipcode || '',
      ])

  const companyName = companyInfo?.companyName || 'บริษัท วินริช ไดนามิก จำกัด'
  const companyAddress = companyInfo?.companyAddress || '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'
  const companyPhone = companyInfo?.companyPhone || '02-123-4567'
  const companyEmail = companyInfo?.companyEmail || 'info@winrichdynamic.com'

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        {/* Header Actions - ซ่อนเมื่อพิมพ์ */}
        <div className="mb-6 print:hidden">
          <div className="flex justify-between items-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← กลับ
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🖨️ พิมพ์
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📄 โหลด PDF
              </button>
            </div>
          </div>
        </div>

        {/* ใบเสนอราคา */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ใบเสนอราคา</h1>
            <p className="text-gray-600">Quotation</p>
          </div>

          {/* ข้อมูลบริษัทและลูกค้า */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* ข้อมูลบริษัท */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลบริษัท</h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-medium">{companyName}</p>
                <p>{companyAddress}</p>
                <p>โทร: {companyPhone}</p>
                <p>อีเมล: {companyEmail}</p>
              </div>
            </div>

            {/* ข้อมูลลูกค้า */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลลูกค้า</h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-medium">{quotation.customerName}</p>
                {quotation.customerTaxId && (
                  <p>เลขประจำตัวผู้เสียภาษี: {quotation.customerTaxId}</p>
                )}
                {quotation.customerAddress && (
                  <p>ที่อยู่: {quotation.customerAddress}</p>
                )}
                {shippingAddress && (
                  <p>ที่อยู่จัดส่ง: {shippingAddress}</p>
                )}
                {quotation.customerPhone && (
                  <p>โทร: {quotation.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* ข้อมูลใบเสนอราคา */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-600">เลขที่ใบเสนอราคา</p>
              <p className="font-semibold text-gray-900">{quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">วันที่สร้าง</p>
              <p className="font-semibold text-gray-900">{formatDate(quotation.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">วันหมดอายุ</p>
              <p className="font-semibold text-gray-900">{formatDate(quotation.validUntil)}</p>
            </div>
          </div>

          {/* หัวข้อ */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{quotation.subject}</h2>
          </div>

          {/* รายการสินค้า */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    รายการ
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    รายละเอียด
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    จำนวน
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    หน่วย
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    SKU
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                    ราคาต่อหน่วย
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    ส่วนลด
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                    ราคารวม
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => {
                  const optionEntries = item.selectedOptions
                    ? Object.entries(item.selectedOptions).filter(([, value]) => value)
                    : [];

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                        <div>{item.description || '-'}</div>
                        {optionEntries.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {optionEntries.map(([name, value]) => (
                              <div key={`${name}-${value}`} className="text-xs text-gray-500">
                                {name}: {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center">
                        {item.quantity.toLocaleString()}
                      </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center">
                      {item.unit}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                      {item.sku || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center">
                        {item.discount > 0 ? `${item.discount}%` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* สรุปราคา */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ราคารวม:</span>
                <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ส่วนลดรวม:</span>
                <span className="font-medium">{formatCurrency(quotation.totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ราคาหลังหักส่วนลด:</span>
                <span className="font-medium">{formatCurrency(quotation.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ภาษีมูลค่าเพิ่ม ({quotation.vatRate}%):</span>
                <span className="font-medium">{formatCurrency(quotation.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                <span>ราคารวมทั้งสิ้น:</span>
                <span>{formatCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* เงื่อนไขและหมายเหตุ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">เงื่อนไขการชำระเงิน</h3>
              <p className="text-gray-700">{quotation.paymentTerms}</p>
            </div>
            {quotation.deliveryTerms && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">เงื่อนไขการส่งมอบ</h3>
                <p className="text-gray-700">{quotation.deliveryTerms}</p>
              </div>
            )}
          </div>

          {quotation.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">หมายเหตุ</h3>
              <p className="text-gray-700">{quotation.notes}</p>
            </div>
          )}

          {/* ข้อมูลเพิ่มเติม */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm text-gray-600">ผู้รับผิดชอบ</p>
              <p className="font-medium text-gray-900">{assigneeSignature?.name || quotation.assignedTo || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">สถานะ</p>
              <p className="font-medium text-gray-900 capitalize">{quotation.status}</p>
            </div>
          </div>

          {/* ลายเซ็น */}
          <div className="flex justify-between items-end pt-12">
            <div className="text-center">
              <div className="w-32 h-0.5 bg-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">ลายเซ็นลูกค้า</p>
            </div>
            <div className="text-center">
              {assigneeSignature?.signatureUrl ? (
                <img
                  src={assigneeSignature.signatureUrl}
                  alt="signature"
                  className="h-10 mx-auto mb-2"
                />
              ) : (
              <div className="w-32 h-0.5 bg-gray-400 mb-2"></div>
              )}
              <p className="text-sm text-gray-600">ลายเซ็นผู้เสนอราคา</p>
              {assigneeSignature?.name && (
                <p className="text-xs text-gray-500 mt-1">
                  {assigneeSignature.name}
                  {assigneeSignature.position ? ` (${assigneeSignature.position})` : ''}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
