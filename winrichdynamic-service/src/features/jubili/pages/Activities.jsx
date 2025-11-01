"use client";

import React, { useState } from 'react';
import { mockActivities } from '@/features/jubili/data/mockData';
import { Users, Target, DollarSign, Briefcase, Plus, Phone, MessageCircle, Calendar, CheckCircle, Clock, Flame } from 'lucide-react';

const Activities = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [activities, setActivities] = useState(mockActivities);

  // สถิติ
  const stats = [
    { label: 'ลูกค้าใหม่', value: '0/74075', percent: '0.00%', icon: Users, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', badgeColor: 'bg-blue-500' },
    { label: 'โอกาส', value: '2/1', percent: '200.00%', icon: Target, bgColor: 'bg-pink-50', borderColor: 'border-pink-300', badgeColor: 'bg-pink-500' },
    { label: 'ยอดขาย', value: '14.1 K/0', percent: '', icon: DollarSign, bgColor: 'bg-green-50', borderColor: 'border-green-300', badgeColor: 'bg-green-500' },
    { label: 'กำไร', value: '14.1 K/0', percent: '', icon: Briefcase, bgColor: 'bg-purple-50', borderColor: 'border-purple-300', badgeColor: 'bg-purple-500' }
  ];

  // Tab
  const tabs = [
    { id: 'today', label: 'งานติดตาม วันนี้', count: 9, total: 65, color: 'bg-pink-500' },
    { id: 'upcoming', label: 'งานติดตาม เร็วๆนี้', count: 6, total: 65, color: 'bg-blue-500' },
    { id: 'overdue', label: 'งานติดตาม เกินกำหนด', count: 20, total: 50, color: 'bg-red-500' }
  ];

  // ไอคอนตามประเภท
  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone size={16} className="text-blue-600" />;
      case 'line': return <MessageCircle size={16} className="text-green-600" />;
      case 'meeting': return <Calendar size={16} className="text-purple-600" />;
      case 'approval': return <CheckCircle size={16} className="text-orange-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  // สีตามประเภท
  const getActivityColor = (type) => {
    switch (type) {
      case 'call': return 'border-l-blue-500 bg-blue-50';
      case 'line': return 'border-l-green-500 bg-green-50';
      case 'meeting': return 'border-l-purple-500 bg-purple-50';
      case 'approval': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Toggle checkbox
  const toggleComplete = (id) => {
    setActivities(activities.map(activity =>
      activity.id === id ? { ...activity, status: activity.status === 'completed' ? 'pending' : 'completed' } : activity
    ));
  };

  // กรองตาม Tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'today') return activity.time === 'Today';
    if (activeTab === 'upcoming') return activity.time !== 'Today' && activity.status !== 'overdue';
    if (activeTab === 'overdue') return activity.status === 'overdue';
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">งานติดตาม</h1>
        <button
          onClick={() => alert('ฟีเจอร์นี้กำลังพัฒนา')}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <Plus size={20} />
          กิจกรรม
        </button>
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
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`border-l-4 ${getActivityColor(activity.type)} p-4 rounded-r-lg transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(activity.id)}
                    className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      activity.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {activity.status === 'completed' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getActivityIcon(activity.type)}
                      <span className="font-semibold text-gray-800">{activity.title}</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium text-blue-600">{activity.customer}</span>
                      {activity.contact && <span> : {activity.contact}</span>}
                    </div>
                    {activity.relatedDoc && (
                      <div className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mb-2">
                        {activity.relatedDoc}
                      </div>
                    )}
                    {activity.note && (
                      <div className="text-xs text-gray-600 italic">{activity.note}</div>
                    )}
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Importance */}
                    <div className="flex gap-0.5">
                      {[...Array(activity.importance || 1)].map((_, i) => (
                        <Flame key={i} size={16} className="text-orange-500 fill-orange-500" />
                      ))}
                    </div>
                    {/* Time */}
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                      {activity.time}
                    </div>
                    {/* Owner */}
                    {activity.owner && (
                      <div className="text-xs text-gray-500">{activity.owner}</div>
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
        </div>
      </div>
    </div>
  );
};

export default Activities;
