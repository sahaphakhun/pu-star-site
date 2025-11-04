"use client";

import React, { useState, useEffect } from 'react';
import useApiService from '@/features/jubili/hooks/useApiService';
import { Users, Target, DollarSign, Briefcase, Plus, Phone, MessageCircle, Calendar, CheckCircle, Clock, Flame, Search, Filter, AlertCircle, Edit, Eye } from 'lucide-react';
import ActivityForm from '@/components/ActivityForm';

const Activities = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    customerId: '',
    ownerId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // Activity form modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const { activities: activitiesApi } = useApiService();

  // สถิติ
  const stats = [
    { label: 'ลูกค้าใหม่', value: '0/74075', percent: '0.00%', icon: Users, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', badgeColor: 'bg-blue-500' },
    { label: 'โอกาส', value: '2/1', percent: '200.00%', icon: Target, bgColor: 'bg-pink-50', borderColor: 'border-pink-300', badgeColor: 'bg-pink-500' },
    { label: 'ยอดขาย', value: '14.1 K/0', percent: '', icon: DollarSign, bgColor: 'bg-green-50', borderColor: 'border-green-300', badgeColor: 'bg-green-500' },
    { label: 'กำไร', value: '14.1 K/0', percent: '', icon: Briefcase, bgColor: 'bg-purple-50', borderColor: 'border-purple-300', badgeColor: 'bg-purple-500' }
  ];

  // Tab
  const [tabs, setTabs] = useState([
    { id: 'today', label: 'งานติดตาม วันนี้', count: 0, total: 0, color: 'bg-pink-500' },
    { id: 'upcoming', label: 'งานติดตาม เร็วๆนี้', count: 0, total: 0, color: 'bg-blue-500' },
    { id: 'overdue', label: 'งานติดตาม เกินกำหนด', count: 0, total: 0, color: 'bg-red-500' }
  ]);

  // ไอคอนตามประเภท
  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone size={16} className="text-blue-600" />;
      case 'email': return <MessageCircle size={16} className="text-green-600" />;
      case 'meeting': return <Calendar size={16} className="text-purple-600" />;
      case 'task': return <CheckCircle size={16} className="text-orange-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  // สีตามประเภท
  const getActivityColor = (type) => {
    switch (type) {
      case 'call': return 'border-l-blue-500 bg-blue-50';
      case 'email': return 'border-l-green-500 bg-green-50';
      case 'meeting': return 'border-l-purple-500 bg-purple-50';
      case 'task': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Toggle checkbox - update activity status
  const toggleComplete = async (id) => {
    try {
      const activity = activities.find(a => a._id === id);
      if (!activity) return;
      
      const newStatus = activity.status === 'done' ? 'planned' : 'done';
      await activitiesApi.updateActivity(id, { status: newStatus });
      
      setActivities(activities.map(a =>
        a._id === id ? { ...a, status: newStatus } : a
      ));
    } catch (error) {
      console.error('Error updating activity:', error);
      setError('ไม่สามารถอัปเดตสถานะกิจกรรมได้');
    }
  };

  // Fetch activities from API
  const fetchActivities = async (page = 1, resetData = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters based on active tab
      let apiFilters = { ...filters, page, limit: pagination.limit };
      
      // Add date filters based on active tab
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (activeTab === 'today') {
        apiFilters.dateFrom = today.toISOString();
        apiFilters.dateTo = tomorrow.toISOString();
      } else if (activeTab === 'upcoming') {
        apiFilters.dateFrom = tomorrow.toISOString();
        apiFilters.status = 'planned';
      } else if (activeTab === 'overdue') {
        apiFilters.dateTo = today.toISOString();
        apiFilters.status = 'planned';
      }
      
      // Add search query if exists
      if (searchQuery) {
        apiFilters.q = searchQuery;
      }
      
      // Add owner search query if exists
      if (ownerSearchQuery) {
        apiFilters.ownerId = ownerSearchQuery;
      }
      
      const response = await activitiesApi.getActivities(apiFilters);
      
      if (resetData) {
        setActivities(response.data || []);
      } else {
        setActivities(prev => [...prev, ...(response.data || [])]);
      }
      
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
      
      // Update tab counts
      updateTabCounts();
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('ไม่สามารถดึงข้อมูลกิจกรรมได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Update tab counts
  const updateTabCounts = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get counts for each tab
      const todayResponse = await activitiesApi.getActivities({
        dateFrom: today.toISOString(),
        dateTo: tomorrow.toISOString(),
        limit: 1
      });
      
      const upcomingResponse = await activitiesApi.getActivities({
        dateFrom: tomorrow.toISOString(),
        status: 'planned',
        limit: 1
      });
      
      const overdueResponse = await activitiesApi.getActivities({
        dateTo: today.toISOString(),
        status: 'planned',
        limit: 1
      });
      
      const totalResponse = await activitiesApi.getActivities({ limit: 1 });
      
      setTabs([
        {
          id: 'today',
          label: 'งานติดตาม วันนี้',
          count: todayResponse.total || 0,
          total: totalResponse.total || 0,
          color: 'bg-pink-500'
        },
        {
          id: 'upcoming',
          label: 'งานติดตาม เร็วๆนี้',
          count: upcomingResponse.total || 0,
          total: totalResponse.total || 0,
          color: 'bg-blue-500'
        },
        {
          id: 'overdue',
          label: 'งานติดตาม เกินกำหนด',
          count: overdueResponse.total || 0,
          total: totalResponse.total || 0,
          color: 'bg-red-500'
        }
      ]);
    } catch (error) {
      console.error('Error updating tab counts:', error);
    }
  };

  // Format date for display
  const formatActivityTime = (scheduledAt) => {
    if (!scheduledAt) return '';
    
    const date = new Date(scheduledAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date >= today && date < tomorrow) {
      return 'Today';
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Check if activity is overdue
  const isOverdue = (scheduledAt, status) => {
    if (status !== 'planned' || !scheduledAt) return false;
    return new Date(scheduledAt) < new Date();
  };

  // Get filtered activities based on current tab
  const getFilteredActivities = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return activities.filter(activity => {
      const activityDate = activity.scheduledAt ? new Date(activity.scheduledAt) : null;
      
      if (activeTab === 'today') {
        return activityDate && activityDate >= today && activityDate < tomorrow;
      } else if (activeTab === 'upcoming') {
        return activityDate && activityDate >= tomorrow && activity.status === 'planned';
      } else if (activeTab === 'overdue') {
        return isOverdue(activity.scheduledAt, activity.status);
      }
      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchActivities(1, true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      customerId: '',
      ownerId: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchQuery('');
    setOwnerSearchQuery('');
    fetchActivities(1, true);
  };

  // Load more activities
  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchActivities(pagination.page + 1, false);
    }
  };

  // Initial load and tab change
  useEffect(() => {
    fetchActivities(1, true);
  }, [activeTab]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchActivities(1, true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Owner search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ownerSearchQuery !== undefined) {
        fetchActivities(1, true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [ownerSearchQuery]);

  const filteredActivities = getFilteredActivities();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">งานติดตาม</h1>
        <button
          onClick={() => {
            setSelectedActivity(null);
            setFormMode('create');
            setShowActivityModal(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <Plus size={20} />
          กิจกรรม
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้รับผิดชอบ..."
              value={ownerSearchQuery}
              onChange={(e) => setOwnerSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            ตัวกรอง
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกประเภท</option>
                <option value="call">โทร</option>
                <option value="email">อีเมล</option>
                <option value="meeting">นัดหมาย</option>
                <option value="task">งาน</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกสถานะ</option>
                <option value="planned">วางแผน</option>
                <option value="done">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="postponed">เลื่อน</option>
              </select>
              
              <input
                type="text"
                placeholder="ผู้รับผิดชอบ..."
                value={filters.ownerId}
                onChange={(e) => handleFilterChange('ownerId', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ใช้ตัวกรอง
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} border-2 ${stat.borderColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative`}>
              {/* Badge Icon */}
              <div className={`absolute -top-2 -right-2 ${stat.badgeColor} w-8 h-8 rounded-full flex items-center justify-center shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="text-sm text-gray-600 mb-2 font-medium">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              
              {stat.percent && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(stat.percent), 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{stat.percent}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? `${tab.color} text-white shadow-lg`
                : 'bg-white text-gray-700 hover:shadow-md'
            }`}
          >
            {tab.label} ({tab.count}/{tab.total})
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => fetchActivities(1, true)}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              ลองใหม่
            </button>
          </div>
        )}
        
        {loading && activities.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <div
                  key={activity._id}
                  className={`border-l-4 ${getActivityColor(activity.type)} p-4 rounded-r-lg transition-all hover:shadow-md ${
                    isOverdue(activity.scheduledAt, activity.status) ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(activity._id)}
                      className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        activity.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {activity.status === 'done' && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getActivityIcon(activity.type)}
                        <span className="font-semibold text-gray-800">{activity.subject}</span>
                        {isOverdue(activity.scheduledAt, activity.status) && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                            เกินกำหนด
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {activity.customerId && (
                          <span className="font-medium text-blue-600">ลูกค้า ID: {activity.customerId}</span>
                        )}
                        {activity.dealId && (
                          <span className="ml-2 font-medium text-purple-600">ดีล ID: {activity.dealId}</span>
                        )}
                        {activity.quotationId && (
                          <span className="ml-2 font-medium text-green-600">ใบเสนอราคา ID: {activity.quotationId}</span>
                        )}
                      </div>
                      {activity.notes && (
                        <div className="text-xs text-gray-600 italic mb-2">{activity.notes}</div>
                      )}
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setFormMode('edit');
                            setShowActivityModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="แก้ไขกิจกรรม"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setFormMode('view');
                            setShowActivityModal(true);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      
                      {/* Time */}
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isOverdue(activity.scheduledAt, activity.status)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formatActivityTime(activity.scheduledAt)}
                      </div>
                      {/* Scheduled time */}
                      {activity.scheduledAt && (
                        <div className="text-xs text-gray-500">
                          {new Date(activity.scheduledAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                      {/* Owner */}
                      {activity.ownerId && (
                        <div className="text-xs text-gray-500">ผู้รับผิดชอบ: {activity.ownerId}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold">ไม่มีกิจกรรมในหมวดนี้</p>
              </div>
            )}
            
            {/* Load More Button */}
            {!loading && pagination.page < pagination.totalPages && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  โหลดเพิ่มเติม
                </button>
              </div>
            )}
            
            {/* Loading indicator for pagination */}
            {loading && activities.length > 0 && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">กำลังโหลด...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Activity Form Modal */}
      <ActivityForm
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activity={selectedActivity}
        mode={formMode}
        onSuccess={(savedActivity) => {
          // Refresh activities list after successful save
          fetchActivities(1, true);
          
          // Show success message
          if (formMode === 'create') {
            // Could add a toast notification here
            console.log('Activity created successfully');
          } else {
            console.log('Activity updated successfully');
          }
          
          // Close the modal and reset form state
          setShowActivityModal(false);
          setSelectedActivity(null);
          setFormMode('create');
        }}
      />
    </div>
  );
};

export default Activities;
