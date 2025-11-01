"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Star, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuotationForm from '@/components/QuotationForm';
import { quotationsApi } from '@/features/jubili/services/apiService';

const statusConfig = {
  draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  pending: { label: 'รออนุมัติ', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  sent: { label: 'ส่งแล้ว', color: 'bg-green-100 text-green-800 border-green-300' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-300' },
};

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    assignedTo: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch quotations from API
  const fetchQuotations = async (page = 1, searchTerm = '', filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page,
        limit: pagination.limit,
        q: searchTerm,
        ...filters
      };
      
      const response = await quotationsApi.getQuotations(queryParams);
      setQuotations(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('ไม่สามารถดึงข้อมูลใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete quotation
  const handleDeleteQuotation = async (id) => {
    if (!confirm('คุณต้องการลบใบเสนอราคานี้หรือไม่?')) {
      return;
    }
    
    try {
      await quotationsApi.deleteQuotation(id);
      // Refresh the list
      fetchQuotations(pagination.page, searchTerm, filters);
    } catch (err) {
      console.error('Error deleting quotation:', err);
      alert('ไม่สามารถลบใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchQuotations(1, term, filters);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchQuotations(1, searchTerm, newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchQuotations(newPage, searchTerm, filters);
  };

  // Initial load
  useEffect(() => {
    fetchQuotations();
  }, []);

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
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="draft">ร่าง</option>
            <option value="sent">ส่งแล้ว</option>
            <option value="accepted">ยอมรับ</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="expired">หมดอายุ</option>
          </select>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchQuotations()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        ) : quotations.length === 0 ? (
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
                {quotations.map((quotation, index) => (
                  <tr key={quotation._id} className={`hover:bg-gray-50 ${borderColors[index % borderColors.length]}`}>
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
                      <div className="text-sm">{quotation.assignedTo || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {quotation.items?.filter(item => item.description).length || 0} รายการ
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(quotation.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(quotation.validUntil)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-600">
                        THB {formatCurrency(quotation.grandTotal || 0)}
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
                          onClick={() => handleDeleteQuotation(quotation._id)}
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
            // Refresh the list after saving
            fetchQuotations(pagination.page, searchTerm, filters);
          }}
        />
      )}

      {/* Pagination */}
      {!loading && !error && quotations.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            แสดง {quotations.length} จาก {pagination.total} รายการ
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              ก่อนหน้า
            </Button>
            <span className="px-3 py-1 text-sm">
              หน้า {pagination.page} จาก {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
