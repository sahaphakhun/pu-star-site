"use client";

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, Camera, Users, Activity, DollarSign, Package, CreditCard, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import Loading from '@/components/ui/Loading';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      }

      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Error state component
  const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-96">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        ลองใหม่
      </button>
    </div>
  );

  // Handle retry
  const handleRetry = () => {
    loadDashboardData();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        <Loading size="lg" label="กำลังโหลดข้อมูลแดชบอร์ด..." className="h-96" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Format data for charts
  const formatProjectStatusData = () => {
    if (!dashboardData?.charts?.projectStatusDistribution) return [];

    const statusMap: Record<string, string> = {
      'planning': 'วางแผน',
      'proposed': 'นำเสนอบริษัท',
      'quoted': 'เสนอราคา',
      'testing': 'ทดสอบสินค้า/ส่งตัวอย่าง',
      'approved': 'อนุมัติราคา',
      'closed': 'ปิดใบเสนอราคา'
    };

    return dashboardData.charts.projectStatusDistribution.map((item: any) => ({
      name: statusMap[item._id] || item._id,
      value: item.count
    }));
  };

  const formatMonthlySalesData = () => {
    if (!dashboardData?.charts?.monthlySalesTrend) return [];

    return dashboardData.charts.monthlySalesTrend.map((item: any) => ({
      month: new Date(item.month + '-01').toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      revenue: item.value,
      orders: item.count
    }));
  };

  const KPICard = ({ title, value, subtitle, change, trend, color = 'blue', additionalInfo, icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
    additionalInfo?: string;
    icon?: React.ReactNode;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-300',
      green: 'bg-green-50 border-green-300',
      red: 'bg-red-50 border-red-300',
      orange: 'bg-orange-50 border-orange-300',
      purple: 'bg-purple-50 border-purple-300',
      yellow: 'bg-yellow-50 border-yellow-300'
    };

    const badgeColors: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500'
    };

    return (
      <div className={`p-3 md:p-4 rounded-lg border-2 ${colorClasses[color]} relative shadow-sm hover:shadow-md transition-shadow`}>
        {/* Colored Badge Icon */}
        {icon && (
          <div className={`absolute -top-2 -right-2 ${badgeColors[color]} w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-md`}>
            {icon}
          </div>
        )}
        <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 font-medium">{title}</div>
        <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mb-1 md:mb-2">{subtitle}</div>}
        {change !== undefined && (
          <div className="flex items-center justify-between">
            <div className={`flex items-center text-xs md:text-sm font-semibold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              {trend === 'up' && <TrendingUp size={14} className="mr-1 md:w-4 md:h-4" />}
              {trend === 'down' && <TrendingDown size={14} className="mr-1 md:w-4 md:h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
            {additionalInfo && <div className="text-xs text-gray-500">{additionalInfo}</div>}
          </div>
        )}
        {additionalInfo && !change && (
          <div className="text-xs text-gray-500 mt-1 md:mt-2">{additionalInfo}</div>
        )}
      </div>
    );
  };

  // Use formatted data from API
  const statusChartData = formatProjectStatusData();

  // Add colors to status chart data
  const statusChartDataWithColors = statusChartData.map((item: { name: string; value: number }, index: number) => {
    const colors = ['#84cc16', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
    return {
      ...item,
      color: colors[index % colors.length]
    };
  });

  const trendData = formatMonthlySalesData();

  const projectStatusData = formatProjectStatusData();

  const paymentPalette = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  const paymentMethodData = (dashboardData?.charts?.paymentMethods || []).map((entry: any, index: number) => ({
    ...entry,
    color: paymentPalette[index % paymentPalette.length],
  }));

  const productGroupData = dashboardData?.charts?.productGroups || [];

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-2 md:p-3 mb-3 md:mb-4">
        <h1 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">แผงบริหาร</h1>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-3 mb-2 md:mb-3">
          <div className="relative">
            <select className="w-full md:w-auto px-2 md:px-3 py-1.5 pr-8 border border-orange-300 rounded bg-orange-50 text-orange-800 font-medium appearance-none cursor-pointer hover:bg-orange-100 text-xs">
              <option>ทีม - กำหนดเอง</option>
            </select>
            <span className="absolute top-0.5 right-0.5 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {dashboardData?.kpis?.customers?.total || 0}
            </span>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ผู้รับผิดชอบ - กำหนดเอง"
              className="w-full px-2 md:px-3 py-1.5 pr-8 border border-purple-300 rounded bg-purple-50 text-purple-800 font-medium placeholder-purple-600 text-xs"
            />
            <span className="absolute top-0.5 right-0.5 bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {dashboardData?.kpis?.deals?.total || 0}
            </span>
          </div>

          <button className="px-3 md:px-4 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-medium rounded shadow-md hover:from-cyan-500 hover:to-cyan-600 text-xs">
            ค้นหาเพิ่มเติม
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-3 mb-2 md:mb-3 overflow-x-auto">
          <div className="px-2 md:px-3 py-1.5 bg-gray-100 rounded border border-gray-300 font-medium text-gray-700 text-xs whitespace-nowrap">
            {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          <button className="px-2 md:px-3 py-1.5 bg-pink-50 border border-pink-300 text-pink-700 rounded hover:bg-pink-100 text-xs font-medium whitespace-nowrap">วันนี้</button>
          <button className="px-2 md:px-3 py-1.5 bg-purple-50 border border-purple-300 text-purple-700 rounded hover:bg-purple-100 text-xs font-medium whitespace-nowrap">เดือนนี้</button>
          <button className="px-2 md:px-3 py-1.5 bg-orange-50 border border-orange-300 text-orange-700 rounded hover:bg-orange-100 text-xs font-medium whitespace-nowrap">ไตรมาสนี้</button>
          <button className="px-2 md:px-3 py-1.5 bg-green-50 border border-green-300 text-green-700 rounded hover:bg-green-100 text-xs font-medium whitespace-nowrap">ปีนี้</button>
          <button className="px-2 md:px-3 py-1.5 bg-red-50 border border-red-300 text-red-700 rounded hover:bg-red-100 text-xs font-medium whitespace-nowrap">กำหนดเอง</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard
          title="ลูกค้าทั้งหมด"
          value={dashboardData?.kpis?.customers?.total || 0}
          subtitle={`ใหม่เดือนนี้: ${dashboardData?.kpis?.customers?.newThisMonth || 0}`}
          color="green"
          additionalInfo={`ลูกค้า active: ${dashboardData?.kpis?.customers?.active || 0}`}
          icon={<Users className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="โครงการทั้งหมด"
          value={dashboardData?.kpis?.projects?.total || 0}
          subtitle={`กำลังดำเนินการ: ${dashboardData?.kpis?.projects?.active || 0}`}
          color="blue"
          additionalInfo={`เดือนนี้: ${dashboardData?.kpis?.projects?.thisMonth || 0}`}
          icon={<Target className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="ใบเสนอราคา"
          value={dashboardData?.kpis?.quotations?.total || 0}
          subtitle={`ส่งแล้ว: ${dashboardData?.kpis?.quotations?.sent || 0}`}
          color="orange"
          additionalInfo={`ยอดรวม: ${dashboardData?.kpis?.quotations?.totalValue?.toLocaleString() || 0}`}
          icon={<Package className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="โอกาสในการขาย"
          value={dashboardData?.kpis?.deals?.total || 0}
          subtitle={`เปิดอยู่: ${dashboardData?.kpis?.deals?.open || 0}`}
          color="purple"
          additionalInfo={`มูลค่า pipeline: ${dashboardData?.kpis?.deals?.pipelineValue?.toLocaleString() || 0}`}
          icon={<Star className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="ยอดขาย"
          value={dashboardData?.kpis?.orders?.total || 0}
          subtitle={`เดือนนี้: ${dashboardData?.kpis?.orders?.thisMonth || 0}`}
          change={dashboardData?.kpis?.orders?.growthRate || 0}
          trend={dashboardData?.kpis?.orders?.growthRate > 0 ? 'up' : dashboardData?.kpis?.orders?.growthRate < 0 ? 'down' : 'neutral'}
          color="green"
          additionalInfo={`มูลค่า: ${dashboardData?.kpis?.orders?.totalValue?.toLocaleString() || 0}`}
          icon={<DollarSign className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="กิจกรรมล่าสุด"
          value={dashboardData?.recentActivities?.length || 0}
          subtitle="กิจกรรมทั้งหมด"
          color="red"
          additionalInfo="อัพเดทล่าสุด"
          icon={<Activity className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Goals Section */}
      <div className="bg-white rounded-lg shadow p-3 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 md:h-5 md:w-5" />
          เป้าหมาย
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">ลูกค้าใหม่</div>
            <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
              {dashboardData?.kpis?.customers?.newThisMonth || 0}
            </div>
            <div className="text-xs text-gray-500">
              เดือนนี้ / ทั้งหมด {dashboardData?.kpis?.customers?.total || 0}
            </div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">โอกาส</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
              {dashboardData?.kpis?.deals?.won || 0}
            </div>
            <div className="text-xs text-gray-500">
              ชนะ / ทั้งหมด {dashboardData?.kpis?.deals?.total || 0}
            </div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">ยอดขาย (รายได้)</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
              {dashboardData?.kpis?.orders?.growthRate > 0 ? '+' : ''}{dashboardData?.kpis?.orders?.growthRate || 0}%
            </div>
            <div className="text-xs text-gray-500">
              {dashboardData?.kpis?.orders?.totalValue?.toLocaleString() || 0} บาท
            </div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">มูลค่าโครงการ</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
              {dashboardData?.kpis?.projects?.totalValue?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-500">
              โครงการทั้งหมด {dashboardData?.kpis?.projects?.total || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">สถานะงาน</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusChartDataWithColors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => `${(Number(props.percent ?? 0) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartDataWithColors.map((entry: { name: string; value: number; color: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {statusChartDataWithColors.map((item: { name: string; value: number; color: string }, index: number) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ความเคลื่อนไหว</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6b7280" strokeWidth={2} name="รายได้" />
              <Line type="monotone" dataKey="orders" stroke="#fbbf24" strokeWidth={2} name="จำนวนออเดอร์" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">กระบวนการขาย</h2>
          <div className="space-y-2">
            <div className="bg-gray-200 p-3 text-center font-bold rounded">ACTIVITY {dashboardData?.kpis?.projects?.total || 0}</div>
            <div className="bg-yellow-200 p-3 text-center font-bold rounded ml-4">LEAD {dashboardData?.kpis?.deals?.total || 0}</div>
            <div className="bg-orange-200 p-3 text-center font-bold rounded ml-8">QO {dashboardData?.kpis?.quotations?.total || 0}</div>
            <div className="bg-green-200 p-3 text-center font-bold rounded ml-12">WIN {dashboardData?.kpis?.deals?.won || 0}</div>
          </div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>WIN Rate - โอกาส: {dashboardData?.kpis?.deals?.total > 0 ? ((dashboardData?.kpis?.deals?.won / dashboardData?.kpis?.deals?.total) * 100).toFixed(2) : 0}%</div>
            <div>WIN Rate - ใบเสนอราคา: {dashboardData?.kpis?.quotations?.total > 0 ? ((dashboardData?.kpis?.deals?.won / dashboardData?.kpis?.quotations?.total) * 100).toFixed(2) : 0}%</div>
          </div>
        </div>

        {/* Recent Activity Photos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            รูปภาพกิจกรรมล่าสุด
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 h-48 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">ยังไม่มีกิจกรรมล่าสุด</p>
              <p className="text-xs">{new Date().toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">สถานะโครงการ</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-600">ใบเสนอราคาโครงการ</div>
              <div className="font-bold">{dashboardData?.kpis?.quotations?.total || 0}</div>
              <div className="text-xs text-gray-500">THB {dashboardData?.kpis?.quotations?.totalValue?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">ยอดขายโครงการ</div>
              <div className="font-bold">{dashboardData?.kpis?.orders?.total || 0}</div>
              <div className="text-xs text-gray-500">THB {dashboardData?.kpis?.orders?.totalValue?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ยอดขายแบ่งตามการชำระเงิน</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${(Number(props.percent ?? 0) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry: { name: string; value: number; color: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Product Groups */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ยอดขายแบ่งตามกลุ่มสินค้า</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productGroupData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '10px' }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6">
                {productGroupData.map((entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 30}, 70%, 50%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
