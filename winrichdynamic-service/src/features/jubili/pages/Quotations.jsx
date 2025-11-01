"use client";

import { useState } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuotationForm from '@/components/QuotationForm';

const statusConfig = {
  draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  pending: { label: 'รออนุมัติ', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  sent: { label: 'ส่งแล้ว', color: 'bg-green-100 text-green-800 border-green-300' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-300' },
};

export default function Quotations() {
  const { quotations, deleteQuotation } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);

  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderStars = (importance) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 inline ${i < importance ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const borderColors = [
    'border-l-4 border-l-blue-500',
    'border-l-4 border-l-green-500',
    'border-l-4 border-l-purple-500',
    'border-l-4 border-l-pink-500',
    'border-l-4 border-l-orange-500',
    'border-l-4 border-l-red-500',
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">ใบเสนอราคา</h1>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้าง
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก หมายเลขใบเสนอราคา หรือ ชื่อลูกค้า"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ทีม - กำหนดเอง
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ค้นหาเพิ่มเติม
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button className="pb-2 px-4 border-b-2 border-blue-500 text-blue-600 font-semibold">
            ใบเสนอราคาทั้งหมด
          </button>
          <button className="pb-2 px-4 text-gray-600 hover:text-gray-800">
            ใบเสนอราคาเกินกำหนด
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบใบเสนอราคา</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
            >
              สร้างใบเสนอราคาใหม่
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">หมายเลขใบเสนอราคา</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ความสำคัญ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ผู้รับผิดชอบ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">สินค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">วันที่ออกเอกสาร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">วันที่ยืนราคา</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">จำนวนเงินรวม</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">คาดการณ์</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredQuotations.map((quotation, index) => (
                  <tr key={quotation.id} className={`hover:bg-gray-50 ${borderColors[index % borderColors.length]}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[quotation.status]?.color || statusConfig.draft.color}`}>
                        {statusConfig[quotation.status]?.label || 'ร่าง'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600 hover:underline cursor-pointer">
                        {quotation.quotationNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderStars(quotation.importance || 3)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{quotation.customerName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{quotation.owner}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {quotation.items?.filter(item => item.description).length || 0} รายการ
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(quotation.issueDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(quotation.validUntilDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-600">
                        THB {formatCurrency(quotation.total || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">-</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuotation(quotation);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('คุณต้องการลบใบเสนอราคานี้หรือไม่?')) {
                              deleteQuotation(quotation.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quotation Form Modal */}
      {showForm && (
        <QuotationForm
          quotation={editingQuotation}
          onClose={() => {
            setShowForm(false);
            setEditingQuotation(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {/* Pagination */}
      {filteredQuotations.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            แสดง {filteredQuotations.length} จาก {quotations.length} รายการ
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">ก่อนหน้า</Button>
            <Button variant="outline" size="sm" className="bg-blue-500 text-white">1</Button>
            <Button variant="outline" size="sm">ถัดไป</Button>
          </div>
        </div>
      )}
    </div>
  );
}
