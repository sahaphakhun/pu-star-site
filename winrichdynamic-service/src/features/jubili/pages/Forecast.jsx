'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Calendar,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { apiService } from '../services/apiService';

export default function Forecast() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('6months');
  const [forecastType, setForecastType] = useState('conservative');

  // Fetch forecast data
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.forecast.getForecast(period, forecastType);
      setForecastData(data);
    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError('ไม่สามารถดึงข้อมูลการพยากรณ์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchForecastData();
  }, [period, forecastType]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format month name
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
  };

  // Get risk level color
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!forecastData?.monthlyData) return [];
    
    return forecastData.monthlyData.map(item => ({
      ...item,
      monthDisplay: formatMonth(item.month),
      upperBound: Math.round(item.forecast * 1.2),
      lowerBound: Math.round(item.forecast * 0.8)
    }));
  };

  // Prepare breakdown data
  const prepareBreakdownData = () => {
    if (!forecastData?.monthlyData) return [];
    
    return forecastData.monthlyData.map(item => ({
      month: formatMonth(item.month),
      พายไลน์: item.pipeline || 0,
      ใบเสนอราคา: item.quotations || 0,
      โปรเจค: item.projects || 0,
      พยากรณ์: item.forecast || 0
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">คาดการณ์</h1>
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">คาดการณ์</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchForecastData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();
  const breakdownData = prepareBreakdownData();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">คาดการณ์</h1>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Period Selection */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3months">3 เดือน</option>
                <option value="6months">6 เดือน</option>
                <option value="1year">1 ปี</option>
              </select>
            </div>
            
            {/* Forecast Type Selection */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <select
                value={forecastType}
                onChange={(e) => setForecastType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conservative">อนุรักษ์นิยม</option>
                <option value="moderate">ปานกลาง</option>
                <option value="aggressive">ก้าวร้าว</option>
              </select>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchForecastData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Forecast */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">ยอดพยากรณ์รวม</h3>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(forecastData?.summary?.totalForecast || 0)}
            </p>
            <div className="flex items-center mt-2">
              {forecastData?.summary?.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${forecastData?.summary?.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(forecastData?.summary?.growthRate || 0)}% จากปีที่แล้ว
              </span>
            </div>
          </div>

          {/* Average Monthly */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">ค่าเฉลี่ยต่อเดือน</h3>
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(forecastData?.summary?.averageMonthlyForecast || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              จาก {forecastData?.monthlyData?.length || 0} เดือน
            </p>
          </div>

          {/* Pipeline Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">มูลค่าพายไลน์</h3>
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(forecastData?.summary?.totalPipeline || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              โอกาสที่เปิดอยู่ทั้งหมด
            </p>
          </div>

          {/* Confidence Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">คะแนนความเชื่อมั่น</h3>
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <p className={`text-2xl font-bold ${getConfidenceColor(forecastData?.summary?.confidence)}`}>
              {forecastData?.summary?.confidence || 0}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  forecastData?.summary?.confidence >= 80 ? 'bg-green-600' :
                  forecastData?.summary?.confidence >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${forecastData?.summary?.confidence || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Forecast Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มการพยากรณ์</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthDisplay" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `เดือน: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stackId="1"
                  stroke="#94a3b8"
                  fill="#e2e8f0"
                  name="ช่วงล่าง"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="พยากรณ์"
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stackId="3"
                  stroke="#1e40af"
                  fill="#dbeafe"
                  name="ช่วงบน"
                />
                <ReferenceLine y={forecastData?.summary?.averageMonthlyForecast} stroke="#ef4444" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การเปรียบเทียบกับประวัติ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthDisplay" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `เดือน: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#6b7280"
                  strokeWidth={2}
                  name="ประวัติ (ปีที่แล้ว)"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="พยากรณ์"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การแบ่งย่อยตามแหล่งที่มา</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `เดือน: ${label}`}
              />
              <Legend />
              <Bar dataKey="พายไลน์" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="ใบเสนอราคา" stackId="a" fill="#3b82f6" />
              <Bar dataKey="โปรเจค" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Opportunities and Risk Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Opportunities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">โอกาสสำคัญที่ส่งผลต่อพยากรณ์</h3>
            <div className="space-y-3">
              {forecastData?.topOpportunities?.length > 0 ? (
                forecastData.topOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{opportunity.title}</p>
                      <p className="text-sm text-gray-500">{opportunity.customerName}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">
                          {opportunity.stageName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {opportunity.probability}% โอกาส
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(opportunity.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">ไม่มีโอกาสที่ส่งผลต่อพยากรณ์ในช่วงเวลานี้</p>
              )}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ปัจจัยความเสี่ยง</h3>
            <div className="space-y-3">
              {forecastData?.riskFactors?.length > 0 ? (
                forecastData.riskFactors.map((risk, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getRiskLevelColor(risk.level)}`}>
                          {risk.level === 'high' ? 'สูง' : risk.level === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{risk.description}</p>
                    <p className="text-xs text-gray-500">{risk.impact}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-500">ไม่พบปัจจัยความเสี่ยงที่สำคัญ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              อัพเดตล่าสุด: {forecastData?.lastUpdated ? 
                new Date(forecastData.lastUpdated).toLocaleString('th-TH') : 
                'ไม่ทราบ'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
