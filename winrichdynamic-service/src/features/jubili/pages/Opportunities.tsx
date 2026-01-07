"use client";

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Flame,
  ThumbsUp,
  Phone,
  User,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
} from 'lucide-react';
import useApiService from '@/features/jubili/hooks/useApiService';
import OpportunityForm from '@/components/OpportunityForm';
import Loading from '@/components/ui/Loading';
import {
  Opportunity,
  OpportunityFilters,
  PipelineStage,
} from '@/features/jubili/services/apiService';

type ActiveTab = 'all' | 'new' | 'contacted' | 'won';
type ModalMode = 'create' | 'edit';

type OpportunityRow = {
  id: string;
  code: string;
  customer: string;
  customerId?: string;
  contact: string;
  phone: string;
  owner: string;
  importance: number;
  products: string[];
  date: string;
  value: number;
  status: Opportunity['status'];
  stageName?: string;
  likes: number;
  probability: number;
  expectedCloseDate?: string;
  tags: string[];
  source: Opportunity;
};

type FiltersState = {
  status: string;
  stageId: string;
  customerId: string;
  ownerId: string;
  team: string;
};

type StatusInfo = {
  label: string;
  color: string;
  icon: string;
};

const initialFilters: FiltersState = {
  status: '',
  stageId: '',
  customerId: '',
  ownerId: '',
  team: '',
};

const Opportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPagesState, setTotalPagesState] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const itemsPerPage = 10;

  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { opportunities: opportunitiesApi, pipelineStages: pipelineStagesApi } = useApiService();

  // ฟังก์ชันแปลงสถานะ
  const getStatusInfo = (status: Opportunity['status'], stageName?: string): StatusInfo => {
    // Map Deal status to UI status
    let uiStatus: string = status;
    if (status === 'open') {
      // Use stage name for more specific status when deal is open
      if (stageName?.toLowerCase().includes('new') || stageName?.toLowerCase().includes('ใหม่')) {
        uiStatus = 'new';
      } else if (stageName?.toLowerCase().includes('contact') || stageName?.toLowerCase().includes('ติดต่อ')) {
        uiStatus = 'contacted';
      } else if (stageName?.toLowerCase().includes('quotation') || stageName?.toLowerCase().includes('ใบเสนอราคา')) {
        uiStatus = 'quotation_sent';
      } else if (stageName?.toLowerCase().includes('negotiat') || stageName?.toLowerCase().includes('เจรจา')) {
        uiStatus = 'negotiating';
      }
    }

    const statusMap: Record<string, StatusInfo> = {
      new: { label: 'ใหม่', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
      contacted: { label: 'ติดต่อแล้ว', color: 'bg-yellow-100 text-yellow-800', icon: '📞' },
      quotation_sent: { label: 'ส่งใบเสนอราคา', color: 'bg-purple-100 text-purple-800', icon: '📄' },
      negotiating: { label: 'เจรจา', color: 'bg-orange-100 text-orange-800', icon: '💬' },
      won: { label: 'ชนะ', color: 'bg-green-100 text-green-800', icon: '✅' },
      lost: { label: 'แพ้', color: 'bg-red-100 text-red-800', icon: '❌' },
    };
    return statusMap[uiStatus] || statusMap.new;
  };

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: OpportunityFilters = {
        page: currentPage,
        limit: itemsPerPage,
        q: searchQuery || undefined,
        status: activeTab !== 'all' ? activeTab : undefined,
      };

      if (filters.status) apiFilters.status = filters.status;
      if (filters.stageId) apiFilters.stageId = filters.stageId;
      if (filters.customerId) apiFilters.customerId = filters.customerId;
      if (filters.ownerId) apiFilters.ownerId = filters.ownerId;
      if (filters.team) apiFilters.team = filters.team;

      const response = await opportunitiesApi.getOpportunities(apiFilters);
      const rows = Array.isArray(response.data) ? response.data : [];

      // Map API response to match UI expectations
      const mappedOpportunities: OpportunityRow[] = rows.map((deal: Opportunity) => {
        const createdAt = deal.createdAt ? new Date(deal.createdAt) : new Date();
        const year = createdAt.getFullYear().toString().slice(-2);
        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
        const day = String(createdAt.getDate()).padStart(2, '0');
        const idSuffix = deal._id ? String(deal._id).slice(-4).toUpperCase() : '0000';
        const probability = typeof deal.probability === 'number' ? deal.probability : undefined;
        const importance = probability !== undefined
          ? Math.min(5, Math.max(1, Math.round(probability / 20)))
          : 3;

        return {
          id: deal._id,
          code: `LD#${year}${month}${day}-${idSuffix}`,
          customer: deal.customerName || 'ไม่ระบุลูกค้า',
          customerId: deal.customerId,
          contact: '-',
          phone: '-',
          owner: deal.ownerId || 'ไม่ระบุ',
          importance,
          products: deal.description ? [deal.description] : ['ไม่ระบุสินค้า'],
          date: deal.createdAt,
          value: deal.amount || 0,
          status: deal.status,
          stageName: deal.stageName,
          likes: Array.isArray(deal.quotationIds) ? deal.quotationIds.length : 0,
          probability: deal.probability || 0,
          expectedCloseDate: deal.expectedCloseDate,
          tags: deal.tags || [],
          source: deal,
        };
      });

      setOpportunities(mappedOpportunities);
      setTotalItems(response.total || 0);
      setTotalPagesState(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลโอกาสได้');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูล Pipeline Stages
  const fetchPipelineStages = async () => {
    try {
      const stages = await pipelineStagesApi.getPipelineStages();
      setPipelineStages(Array.isArray(stages) ? stages : []);
    } catch (err) {
      console.error('Error fetching pipeline stages:', err);
    }
  };

  // ฟังก์ชันรีเฟรชข้อมูล
  const handleRefresh = () => {
    fetchOpportunities();
  };

  // ฟังก์ชันเปิด modal สร้างโอกาส
  const handleCreateOpportunity = () => {
    setModalMode('create');
    setSelectedOpportunity(null);
    setIsModalOpen(true);
  };

  // ฟังก์ชันเปิด modal แก้ไขโอกาส
  const handleEditOpportunity = (opportunity: OpportunityRow) => {
    setModalMode('edit');
    setSelectedOpportunity(opportunity.source);
    setIsModalOpen(true);
  };

  // ฟังก์ชันดูรายละเอียดโอกาส
  const handleViewOpportunity = (opportunity: OpportunityRow) => {
    // For now, just open in edit mode as view-only
    setModalMode('edit');
    setSelectedOpportunity(opportunity.source);
    setIsModalOpen(true);
  };

  // ฟังก์ชันปิด modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOpportunity(null);
  };

  // ฟังก์ชันหลังบันทึกสำเร็จ
  const handleOpportunitySuccess = (_opportunity: Opportunity) => {
    setSuccessMessage(
      modalMode === 'create'
        ? 'สร้างโอกาสเรียบร้อยแล้ว'
        : 'แก้ไขโอกาสเรียบร้อยแล้ว'
    );
    fetchOpportunities(); // รีเฟรชข้อมูล

    // ซ่อนข้อความสำเร็จหลัง 3 วินาที
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ฟังก์ชันค้นหา
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOpportunities();
  };

  // ฟังก์ชันเปลี่ยน Tab
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ฟังก์ชันรีเซ็ตฟิลเตอร์
  const handleResetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // คำนวณมูลค่ารวม
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  // ดึงข้อมูลเมื่อ component mount และเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    fetchOpportunities();
    fetchPipelineStages();
  }, [currentPage, activeTab, searchQuery, filters]);

  return (
    <div className="p-6">
      {/* Header with Total Value */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">โอกาส</h1>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-lg shadow-md">
            <div className="text-sm">มูลค่ารวม</div>
            <div className="text-2xl font-bold">
              THB {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
          <button
            onClick={handleCreateOpportunity}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md"
          >
            <Plus size={20} />
            สร้างโอกาส
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาโอกาส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
            disabled={loading}
          >
            ค้นหา
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Filter size={20} />
            ฟิลเตอร์
          </button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-5 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">สถานะทั้งหมด</option>
                <option value="open">เปิด</option>
                <option value="won">ชนะ</option>
                <option value="lost">แพ้</option>
              </select>
              <select
                value={filters.stageId}
                onChange={(e) => setFilters({ ...filters, stageId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">สเตจทั้งหมด</option>
                {pipelineStages.map((stage) => (
                  <option key={stage._id} value={stage._id}>{stage.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="รหัสลูกค้า"
                value={filters.customerId}
                onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="พนักงานขาย"
                value={filters.ownerId}
                onChange={(e) => setFilters({ ...filters, ownerId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="ทีม"
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleResetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all"
              >
                รีเซ็ตฟิลเตอร์
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด ({totalItems})
        </button>
        <button
          onClick={() => handleTabChange('new')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'new'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ใหม่
        </button>
        <button
          onClick={() => handleTabChange('contacted')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'contacted'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ติดต่อแล้ว
        </button>
        <button
          onClick={() => handleTabChange('won')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'won'
              ? 'bg-blue-500 text-white font-semibold shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ชนะ
        </button>
      </div>

      {/* Loading State */}
      {loading && <Loading size="lg" label="กำลังโหลดข้อมูล..." className="py-12" />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <div>
            <h3 className="font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="ml-auto bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-all"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 z-50">
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && opportunities.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Search size={48} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">ไม่พบข้อมูลโอกาส</h3>
          <p className="text-gray-500 mb-4">ไม่พบข้อมูลโอกาสที่ตรงกับเงื่อนไขที่ค้นหา</p>
          <button
            onClick={handleResetFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            ล้างตัวกรองและลองใหม่
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            <div className="col-span-2">หมายเลข</div>
            <div className="col-span-2">ลูกค้า</div>
            <div className="col-span-2">ผู้ติดต่อ</div>
            <div className="col-span-1">ความสำคัญ</div>
            <div className="col-span-2">สินค้า</div>
            <div className="col-span-1">วันที่</div>
            <div className="col-span-1">มูลค่า</div>
            <div className="col-span-1">สถานะ</div>
          </div>

          {/* Table Body */}
          <div>
            {opportunities.map((opp) => {
              const statusInfo = getStatusInfo(opp.status, opp.stageName);

              return (
                <div
                  key={opp.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* หมายเลข */}
                  <div className="col-span-2 flex items-center">
                    <span className="font-semibold text-gray-800">{opp.code}</span>
                  </div>

                  {/* ลูกค้า */}
                  <div className="col-span-2">
                    <div className="font-semibold text-gray-800">{opp.customer}</div>
                  </div>

                  {/* ผู้ติดต่อ */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <span>{opp.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} />
                      <span>{opp.phone}</span>
                    </div>
                  </div>

                  {/* ความสำคัญ */}
                  <div className="col-span-1 flex items-center gap-1">
                    {Array.from({ length: opp.importance }).map((_, i) => (
                      <Flame key={i} size={16} className="text-orange-500 fill-orange-500" />
                    ))}
                  </div>

                  {/* สินค้า */}
                  <div className="col-span-2 text-sm">
                    {opp.products.slice(0, 2).map((product, i) => (
                      <div key={i} className="text-gray-600 truncate">{product}</div>
                    ))}
                    {opp.products.length > 2 && (
                      <div className="text-gray-400">+{opp.products.length - 2} รายการ</div>
                    )}
                  </div>

                  {/* วันที่ */}
                  <div className="col-span-1">
                    {opp.date
                      ? new Date(opp.date).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '-'}
                  </div>

                  {/* มูลค่า */}
                  <div className="col-span-1 font-semibold text-green-600">
                    {opp.value > 0 ? `฿${opp.value.toLocaleString()}` : '-'}
                  </div>

                  {/* สถานะและ Actions */}
                  <div className="col-span-1 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} flex items-center gap-1`}>
                      <span>{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                    {opp.likes > 0 && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <ThumbsUp size={14} className="fill-blue-500" />
                        <span className="text-xs font-semibold">{opp.likes}</span>
                      </div>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => handleViewOpportunity(opp)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditOpportunity(opp)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="แก้ไข"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPagesState > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            ก่อนหน้า
          </button>
          {Array.from({ length: totalPagesState }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPagesState}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentPage === totalPagesState
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Opportunity Form Modal */}
      <OpportunityForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        opportunity={selectedOpportunity}
        onSuccess={handleOpportunitySuccess}
        mode={modalMode}
      />
    </div>
  );
};

export default Opportunities;
