"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, Star, TrendingUp, Clock, CheckCircle, XCircle, Circle, Truck, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import SalesOrderForm from '@/components/SalesOrderForm';
import { salesOrdersApi, SalesOrderFilters } from '@/features/jubili/services/apiService';

const statusConfig = {
  draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Circle },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  processing: { label: 'กำลังดำเนินการ', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Clock },
  completed: { label: 'เสร็จสมบูรณ์', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

const deliveryStatusConfig = {
  pending: { label: 'รอจัดเตรียม', color: 'bg-gray-100 text-gray-800', icon: Package },
  preparing: { label: 'กำลังจัดเตรียม', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'จัดส่งแล้ว', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'ส่งถึงแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const paymentStatusConfig = {
  unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-800', icon: XCircle },
  partial: { label: 'ชำระบางส่วน', color: 'bg-orange-100 text-orange-800', icon: Clock },
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function SalesOrders() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({});

  // Fetch sales orders from API
  const fetchSalesOrders = async (page = 1, newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiFilters = {
        page,
        limit: pagination.limit,
        ...newFilters
      };

      // Add search term if provided
      if (searchTerm) {
        apiFilters.q = searchTerm;
      }

      // Add tab-specific filters
      if (activeTab === 'pending_delivery') {
        apiFilters.status = 'confirmed,ready,shipped'; // Orders that are not delivered yet
      } else if (activeTab === 'pending_payment') {
        apiFilters.status = 'pending,confirmed,ready'; // Orders that might not be fully paid
      }

      const response = await salesOrdersApi.getSalesOrders(apiFilters);
      
      setSalesOrders(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError('ไม่สามารถโหลดข้อมูลใบสั่งขายได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchSalesOrders(1, filters);
  }, [searchTerm, activeTab, filters]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchSalesOrders(newPage, filters);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (confirm('คุณต้องการลบใบสั่งขายนี้หรือไม่?')) {
      try {
        await salesOrdersApi.deleteSalesOrder(id);
        // Refresh the list
        fetchSalesOrders(pagination.page, filters);
      } catch (err) {
        console.error('Error deleting sales order:', err);
        setError('ไม่สามารถลบใบสั่งขายได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Handle form save
  const handleFormSave = () => {
    setShowForm(false);
    setEditingSalesOrder(null);
    // Refresh the list
    fetchSalesOrders(pagination.page, filters);
  };

  // Transform order data for UI
  const transformOrderData = (order) => {
    // Map API fields to UI expected fields
    return {
      ...order,
      id: order._id,
      salesOrderNumber: order._id.substring(0, 8).toUpperCase(), // Generate a short ID for display
      customerName: order.customerName || '-',
      owner: 'Admin', // Default owner since it's not in the model
      projectName: '-', // Not in the model
      importance: 3, // Default importance
      orderDate: order.orderDate || order.createdAt,
      deliveryDate: order.deliveryDate || null,
      deliveryStatus: order.status === 'delivered' ? 'delivered' :
                     order.status === 'shipped' ? 'shipped' :
                     order.status === 'ready' ? 'preparing' : 'pending',
      paymentStatus: order.slipVerification?.verified ? 'paid' : 'unpaid',
      total: order.totalAmount || 0,
      paidAmount: order.slipVerification?.verified ? order.totalAmount || 0 : 0,
      remainingAmount: order.slipVerification?.verified ? 0 : order.totalAmount || 0,
      status: order.status || 'draft'
    };
  };

  const transformedSalesOrders = salesOrders.map(transformOrderData);

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
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < importance ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getRowColors = (index) => {
    const colorSets = [
      { border: 'border-l-blue-500', bg: 'bg-blue-50' },
      { border: 'border-l-green-500', bg: 'bg-green-50' },
      { border: 'border-l-purple-500', bg: 'bg-purple-50' },
      { border: 'border-l-pink-500', bg: 'bg-pink-50' },
      { border: 'border-l-orange-500', bg: 'bg-orange-50' },
      { border: 'border-l-red-500', bg: 'bg-red-50' },
    ];
    return colorSets[index % colorSets.length];
  };

  const getColumnBg = (colIndex) => {
    const colors = [
      'bg-gray-50',
      'bg-blue-50',
      'bg-green-50',
      'bg-yellow-50',
      'bg-pink-50',
      'bg-purple-50',
      'bg-cyan-50',
      'bg-orange-50',
      'bg-teal-50',
      'bg-indigo-50',
      'bg-red-50',
      'bg-lime-50',
      'bg-rose-50',
    ];
    return colors[colIndex % colors.length];
  };

  const getRandomIcon = () => {
    const icons = [
      { color: 'text-red-500', shape: '●' },
      { color: 'text-blue-500', shape: '■' },
      { color: 'text-green-500', shape: '▲' },
      { color: 'text-yellow-500', shape: '◆' },
      { color: 'text-purple-500', shape: '●' },
      { color: 'text-pink-500', shape: '■' },
      { color: 'text-cyan-500', shape: '▲' },
      { color: 'text-orange-500', shape: '◆' },
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  // คำนวณสถิติ
  const totalOrders = pagination.total;
  const totalValue = transformedSalesOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalPaid = transformedSalesOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);
  const totalRemaining = transformedSalesOrders.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">ใบสั่งขายทั้งหมด</div>
            <Package className="h-6 w-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{totalOrders}</div>
          <div className="text-xs opacity-75 mt-1">รายการ</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">มูลค่ารวม</div>
            <TrendingUp className="h-6 w-6 opacity-80" />
          </div>
          <div className="text-2xl font-bold">THB {formatCurrency(totalValue)}</div>
          <div className="text-xs opacity-75 mt-1">บาท</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">ชำระแล้ว</div>
            <CheckCircle className="h-6 w-6 opacity-80" />
          </div>
          <div className="text-2xl font-bold">THB {formatCurrency(totalPaid)}</div>
          <div className="text-xs opacity-75 mt-1">บาท</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">ค้างชำระ</div>
            <Clock className="h-6 w-6 opacity-80" />
          </div>
          <div className="text-2xl font-bold">THB {formatCurrency(totalRemaining)}</div>
          <div className="text-xs opacity-75 mt-1">บาท</div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">ใบสั่งขาย</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchSalesOrders(pagination.page, filters)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              สร้าง
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก หมายเลขใบสั่งขาย หรือ ชื่อลูกค้า"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100"
          >
            <Filter className="h-4 w-4" />
            ทีม - กำหนดเอง
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
          >
            <Filter className="h-4 w-4" />
            ค้นหาเพิ่มเติม
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            ใบสั่งขายทั้งหมด
          </button>
          <button
            onClick={() => setActiveTab('pending_delivery')}
            className={`pb-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'pending_delivery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            รอจัดส่ง
          </button>
          <button
            onClick={() => setActiveTab('pending_payment')}
            className={`pb-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'pending_payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            รอชำระเงิน
          </button>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 mb-2">กำลังโหลดข้อมูลใบสั่งขาย...</p>
          </div>
        ) : transformedSalesOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">ไม่พบใบสั่งขาย</p>
            <p className="text-sm text-gray-400 mb-4">เริ่มต้นสร้างใบสั่งขายแรกของคุณ</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              สร้างใบสั่งขายใหม่
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(0)}`}>ไอคอน</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(1)}`}>สถานะ</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(2)}`}>หมายเลขใบสั่งขาย</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(3)}`}>ความสำคัญ</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(4)}`}>ลูกค้า</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(5)}`}>ผู้รับผิดชอบ</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(6)}`}>วันที่สั่งซื้อ</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(7)}`}>วันที่จัดส่ง</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(8)}`}>สถานะจัดส่ง</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(9)}`}>สถานะชำระเงิน</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(10)}`}>ยอดรวม</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(11)}`}>ชำระแล้ว</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(12)}`}>คงเหลือ</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${getColumnBg(0)}`}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transformedSalesOrders.map((order, index) => {
                  const rowColors = getRowColors(index);
                  const StatusIcon = statusConfig[order.status]?.icon || Circle;
                  const DeliveryIcon = deliveryStatusConfig[order.deliveryStatus]?.icon || Package;
                  const PaymentIcon = paymentStatusConfig[order.paymentStatus]?.icon || CreditCard;
                  const randomIcon = getRandomIcon();
                  
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors border-l-4 ${rowColors.border} ${rowColors.bg}`}>
                      <td className={`px-4 py-3 ${getColumnBg(0)}`}>
                        <span className={`text-2xl font-bold ${randomIcon.color}`}>
                          {randomIcon.shape}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(1)}`}>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status]?.color || statusConfig.draft.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status]?.label || 'ร่าง'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(2)}`}>
                        <div className="font-semibold text-blue-600 hover:underline cursor-pointer">
                          {order.salesOrderNumber}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(3)}`}>
                        {renderStars(order.importance || 3)}
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(4)}`}>
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.projectName || '-'}</div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(5)}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {order.owner?.charAt(0) || 'A'}
                          </div>
                          <div className="text-sm font-medium">{order.owner}</div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(6)}`}>
                        <div className="text-sm text-gray-700">{formatDate(order.orderDate)}</div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(7)}`}>
                        <div className="text-sm text-gray-700">{formatDate(order.deliveryDate)}</div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(8)}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${deliveryStatusConfig[order.deliveryStatus]?.color}`}>
                          <DeliveryIcon className="h-3 w-3" />
                          {deliveryStatusConfig[order.deliveryStatus]?.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(9)}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[order.paymentStatus]?.color}`}>
                          <PaymentIcon className="h-3 w-3" />
                          {paymentStatusConfig[order.paymentStatus]?.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(10)}`}>
                        <div className="font-bold text-blue-600">
                          THB {formatCurrency(order.total || 0)}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(11)}`}>
                        <div className="font-bold text-green-600">
                          {formatCurrency(order.paidAmount || 0)}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(12)}`}>
                        <div className={`font-bold ${order.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(order.remainingAmount || 0)}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getColumnBg(0)}`}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSalesOrder(order);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Order Form Modal */}
      {showForm && (
        <SalesOrderForm
          salesOrder={editingSalesOrder}
          onClose={() => {
            setShowForm(false);
            setEditingSalesOrder(null);
          }}
          onSave={handleFormSave}
        />
      )}

      {/* Pagination */}
      {transformedSalesOrders.length > 0 && (
        <div className="mt-4 flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-700">
            แสดง <span className="font-semibold text-blue-600">{transformedSalesOrders.length}</span> จาก <span className="font-semibold">{pagination.total}</span> รายการ
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-100"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              ก่อนหน้า
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant="outline"
                  size="sm"
                  className={pagination.page === pageNum ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-100"}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-100"
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
