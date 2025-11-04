'use client';

import React, { useEffect, useState } from 'react';

export default function AdminB2BOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [quotation, setQuotation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingQuotation, setGeneratingQuotation] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ');
        setOrder(data);
      } catch (e: any) {
        setError(e?.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Load quotation information if exists
  useEffect(() => {
    if (!order || !order.generatedQuotationId) return;
    
    const loadQuotation = async () => {
      try {
        const res = await fetch(`/api/quotations/${order.generatedQuotationId}`);
        const data = await res.json();
        if (res.ok) {
          setQuotation(data);
        }
      } catch (e) {
        console.error('Failed to load quotation:', e);
      }
    };
    loadQuotation();
  }, [order]);

  const handleGenerateQuotation = async () => {
    if (!id) return;
    
    setGeneratingQuotation(true);
    try {
      const res = await fetch('/api/quotations/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          options: {
            autoConvertToSalesOrder: false,
            requireAdminApproval: true,
            conversionDelay: 0,
            customValidityDays: 7
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'สร้างใบเสนอราคาไม่สำเร็จ');
      
      // Update order with quotation info
      setOrder((prev: any) => ({
        ...prev,
        generatedQuotationId: data.quotation.id,
        quotationStatus: 'generated',
        quotationGeneratedAt: new Date()
      }));
      setQuotation(data.quotation);
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGeneratingQuotation(false);
    }
  };

  const getQuotationStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'รอดำเนินการ',
      'generated': 'สร้างแล้ว',
      'accepted': 'ยอมรับ',
      'rejected': 'ปฏิเสธ'
    };
    return statusMap[status] || status;
  };

  const getQuotationStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'text-yellow-600',
      'generated': 'text-blue-600',
      'accepted': 'text-green-600',
      'rejected': 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!order) return <div className="p-6">ไม่พบคำสั่งซื้อ</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order._id}</h1>
      
      {/* Quotation Information Section */}
      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-2 flex justify-between items-center">
          <span>ข้อมูลใบเสนอราคา</span>
          {!order.generatedQuotationId && (
            <button
              onClick={handleGenerateQuotation}
              disabled={generatingQuotation}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              {generatingQuotation ? 'กำลังสร้าง...' : 'สร้างใบเสนอราคา'}
            </button>
          )}
        </div>
        
        {order.generatedQuotationId ? (
          <div className="space-y-1">
            <div>สถานะ: <span className={`font-medium ${getQuotationStatusColor(order.quotationStatus || 'generated')}`}>
              {getQuotationStatusText(order.quotationStatus || 'generated')}
            </span></div>
            <div>วันที่สร้าง: {order.quotationGeneratedAt ? new Date(order.quotationGeneratedAt).toLocaleDateString('th-TH') : '-'}</div>
            {quotation && (
              <>
                <div>เลขที่ใบเสนอราคา: {quotation.quotationNumber}</div>
                <div>วันหมดอายุ: {new Date(quotation.validUntil).toLocaleDateString('th-TH')}</div>
                <div>ยอดรวม: ฿{quotation.totalAmount?.toLocaleString()}</div>
                <div className="flex space-x-2 mt-2">
                  <a
                    href={`/adminb2b/quotations/${quotation._id}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    ดูใบเสนอราคา
                  </a>
                  {quotation.status === 'accepted' && !quotation.convertedToOrder && (
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      onClick={() => window.location.href = `/api/quotations/${quotation._id}/convert-to-sales-order`}
                    >
                      แปลงเป็นใบสั่งขาย
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-gray-500">ยังไม่มีใบเสนอราคา</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">ข้อมูลลูกค้า</div>
          <div>ชื่อ: {order.customerName}</div>
          <div>เบอร์: {order.customerPhone}</div>
          <div>วิธีชำระเงิน: {order.paymentMethod}</div>
          <div>สถานะ: {order.status}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">สรุปยอด</div>
          <div>ค่าสินค้า: ฿{order.totalAmount?.toLocaleString()}</div>
          <div>ค่าส่ง: ฿{order.shippingFee?.toLocaleString()}</div>
          <div className="font-semibold mt-1">รวม: ฿{(order.totalAmount + (order.shippingFee || 0))?.toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-2">รายการสินค้า</div>
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="py-1">สินค้า</th>
              <th className="py-1">จำนวน</th>
              <th className="py-1">ราคา</th>
              <th className="py-1">รวม</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it: any, idx: number) => (
              <tr key={idx}>
                <td className="py-1">{it.name}</td>
                <td className="py-1">{it.quantity}</td>
                <td className="py-1">฿{it.price?.toLocaleString()}</td>
                <td className="py-1">฿{(it.price * it.quantity)?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


