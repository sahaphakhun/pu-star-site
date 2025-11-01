"use client";

import { useState, useEffect } from 'react';
import { apiService, APIError } from '@/features/jubili/services/apiService';
import { Plus, Search, Star, FileText, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProjectForm from '@/components/ProjectForm';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('กำหนด');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProject, setSelectedProject] = useState(null);

  // Map Thai status to English status for API
  const statusMap = {
    'กำหนด': '',
    'นำเสนอบริษัท': 'proposed',
    'เสนอราคา': 'quoted',
    'ทดสอบสินค้า': 'testing',
    'อนุมัติราคา': 'approved',
    'ปิดใบเสนอราคา': 'closed'
  };

  // Fetch projects from API
  const fetchProjects = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page,
        limit: pagination.limit,
        q: search,
        status: statusMap[status] || status
      };
      
      const response = await apiService.projects.getProjects(filters);
      setProjects(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProjects(pagination.page, searchTerm, statusFilter);
  }, []);

  // Handle search and filter
  const handleSearch = () => {
    fetchProjects(1, searchTerm, statusFilter);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchProjects(newPage, searchTerm, statusFilter);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProjects(pagination.page, searchTerm, statusFilter);
  };

  // CRUD operation handlers
  const handleViewProject = async (projectId) => {
    try {
      const project = await apiService.projects.getProject(projectId);
      setSelectedProject(project);
      setModalMode('view'); // We'll use edit mode but make fields read-only
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching project:', err);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
      }
    }
  };

  const handleEditProject = async (projectId) => {
    try {
      const project = await apiService.projects.getProject(projectId);
      setSelectedProject(project);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching project:', err);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
      }
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSuccess = (result) => {
    // Refresh the projects list after successful create/update
    fetchProjects(pagination.page, searchTerm, statusFilter);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('คุณต้องการลบโปรเจคนี้ใช่หรือไม่?')) {
      try {
        await apiService.projects.deleteProject(projectId);
        // Refresh the projects list
        fetchProjects(pagination.page, searchTerm, statusFilter);
      } catch (err) {
        console.error('Error deleting project:', err);
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('เกิดข้อผิดพลาดในการลบโปรเจค');
        }
      }
    }
  };

  // คำนวณมูลค่ารวม
  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);

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
      { border: 'border-l-red-500', bg: 'bg-red-50', icon: 'bg-red-400' },
      { border: 'border-l-purple-500', bg: 'bg-purple-50', icon: 'bg-purple-400' },
      { border: 'border-l-green-500', bg: 'bg-green-50', icon: 'bg-green-400' },
      { border: 'border-l-orange-500', bg: 'bg-orange-50', icon: 'bg-orange-400' },
      { border: 'border-l-blue-500', bg: 'bg-blue-50', icon: 'bg-blue-400' },
      { border: 'border-l-pink-500', bg: 'bg-pink-50', icon: 'bg-pink-400' },
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
    ];
    return colors[colIndex % colors.length];
  };

  const getRandomIcon = () => {
    const icons = [
      { color: 'bg-red-400', text: '●' },
      { color: 'bg-blue-400', text: '■' },
      { color: 'bg-green-400', text: '▲' },
      { color: 'bg-yellow-400', text: '◆' },
      { color: 'bg-purple-400', text: '●' },
      { color: 'bg-pink-400', text: '■' },
      { color: 'bg-cyan-400', text: '▲' },
      { color: 'bg-orange-400', text: '◆' },
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">โครงการ</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-700">
              มูลค่ารวม <span className="text-blue-600">THB {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก หมายเลขโครงการ หรือ ชื่อโครงการ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="กำหนด">สถานะ - กำหนด</option>
            <option value="นำเสนอบริษัท">นำเสนอบริษัท</option>
            <option value="เสนอราคา">เสนอราคา</option>
            <option value="ทดสอบสินค้า">ทดสอบสินค้า/ส่งตัวอย่าง</option>
            <option value="อนุมัติราคา">อนุมัติราคา</option>
            <option value="ปิดใบเสนอราคา">ปิดใบเสนอราคา</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200"
          >
            ค้นหาเพิ่มเติม
          </button>

          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            onClick={handleCreateProject}
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้าง
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-gray-400 text-lg">ไม่พบข้อมูลโครงการ</div>
          <p className="text-gray-500 mt-2">ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือสร้างโครงการใหม่</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && projects.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="px-3 py-3 text-center text-sm font-medium">ไอคอน</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">รหัสโครงการ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">โครงการ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">ลูกค้า</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">ความสำคัญ</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">ใบเสนอราคา</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">กิจกรรม</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">วันเริ่มต้น-วันสิ้นสุด</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">มูลค่า</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">ผู้รับผิดชอบ</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => {
                  const colors = getRowColors(index);
                  const icon = getRandomIcon();
                  
                  return (
                    <tr
                      key={project._id}
                      className={`border-b border-l-4 ${colors.border} ${colors.bg} hover:bg-gray-100 cursor-pointer`}
                    >
                      {/* Icon */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(0)}`}>
                        <div className={`w-6 h-6 rounded-full ${icon.color} flex items-center justify-center text-white text-xs mx-auto`}>
                          {icon.text}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(1)}`}>
                        <div className={`w-8 h-8 rounded ${colors.icon} flex items-center justify-center text-white font-bold mx-auto`}>
                          {project.status ? project.status.charAt(0).toUpperCase() : '1'}
                        </div>
                      </td>

                      {/* Code */}
                      <td className={`px-4 py-3 ${getColumnBg(2)}`}>
                        <div className="font-medium text-gray-900">{project.projectCode || `PJ#${String(index + 1).padStart(6, '0')}`}</div>
                      </td>

                      {/* Project Name */}
                      <td className={`px-4 py-3 ${getColumnBg(3)}`}>
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-600">{project.type || 'บ้าน / ทาวน์เฮาส์ / ที่พักอาศัยแนวราบ'}</div>
                      </td>

                      {/* Customer */}
                      <td className={`px-4 py-3 ${getColumnBg(4)}`}>
                        <div className="font-medium text-gray-900">{project.customerName}</div>
                        <div className="mt-1">
                          <span className="px-2 py-0.5 text-xs rounded bg-red-500 text-white">
                            Project Sales
                          </span>
                        </div>
                      </td>

                      {/* Importance */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(5)}`}>
                        <div className="flex justify-center">
                          {renderStars(project.importance || 1)}
                        </div>
                      </td>

                      {/* Quotations */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(6)}`}>
                        <div className="font-medium text-gray-900">{project.quotationCount || 0}</div>
                      </td>

                      {/* Activities */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(7)}`}>
                        <div className="font-medium text-gray-900">{project.activityCount || 1}</div>
                      </td>

                      {/* Date Range */}
                      <td className={`px-4 py-3 ${getColumnBg(8)}`}>
                        <div className="text-sm text-gray-900">
                          {new Date(project.startDate || Date.now()).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-900">
                          - {project.endDate ? new Date(project.endDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>

                      {/* Value */}
                      <td className={`px-4 py-3 text-right ${getColumnBg(9)}`}>
                        <div className="font-medium text-gray-900">
                          {(project.value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className={`px-4 py-3 ${getColumnBg(10)}`}>
                        <div className="font-medium text-gray-900">{project.ownerName || 'Saleprojects 1'}</div>
                      </td>

                      {/* Actions */}
                      <td className={`px-3 py-3 text-center ${getColumnBg(11)}`}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleViewProject(project._id)}
                            className="w-6 h-6 rounded bg-blue-400 flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80"
                            title="ดูรายละเอียด"
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleEditProject(project._id)}
                            className="w-6 h-6 rounded bg-green-400 flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80"
                            title="แก้ไข"
                          >
                            <Activity className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="w-6 h-6 rounded bg-red-400 flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80"
                            title="ลบ"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จากทั้งหมด {pagination.total} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">
                  {pagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={selectedProject}
        mode={modalMode}
        onSuccess={handleProjectSuccess}
      />
    </div>
  );
}
