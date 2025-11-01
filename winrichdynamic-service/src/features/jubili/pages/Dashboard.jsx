"use client";

import { useData } from '@/features/jubili/context/DataContext';
import { TrendingUp, TrendingDown, Target, Camera, Users, Activity, DollarSign, Package, CreditCard, Star } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { dashboard } = useData();

  const KPICard = ({ title, value, subtitle, change, trend, color = 'blue', additionalInfo, icon }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-300',
      green: 'bg-green-50 border-green-300',
      red: 'bg-red-50 border-red-300',
      orange: 'bg-orange-50 border-orange-300',
      purple: 'bg-purple-50 border-purple-300',
      yellow: 'bg-yellow-50 border-yellow-300'
    };

    const badgeColors = {
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

  const statusChartData = [
    { name: 'โครงการใหม่', value: 76.3, color: '#84cc16' },
    { name: 'WIN', value: 16.9, color: '#3b82f6' },
    { name: 'เสนอราคา', value: 5.1, color: '#f59e0b' },
    { name: 'LOST', value: 0.0, color: '#ef4444' },
    { name: 'ต่อรองราคา', value: 1.7, color: '#8b5cf6' }
  ];

  const salesTeamData = [
    { name: 'PU STAR Office', total: 23, new: 0, quotation: 1, negotiation: 2, lost: 0, win: 21 },
    { name: 'Saletrades 1 Kitti Sale', total: 17, new: 0, quotation: 4, negotiation: 0, lost: 0, win: 8 },
    { name: 'Saleprojects 2 Suchada', total: 13, new: 0, quotation: 0, negotiation: 0, lost: 0, win: 1 },
    { name: 'Chawanya Thanomwong', total: 11, new: 0, quotation: 2, negotiation: 1, lost: 1, win: 11 },
    { name: 'Saleprojects 1 Sunisa', total: 9, new: 0, quotation: 0, negotiation: 0, lost: 0, win: 0 },
    { name: 'ณรงค์เดช ศรสมบัติ', total: 8, new: 0, quotation: 3, negotiation: 0, lost: 0, win: 4 },
  ];

  const trendData = [
    { date: '1. Oct', activity: 20, lead: 15, win: 10 },
    { date: '3. Oct', activity: 25, lead: 20, win: 12 },
    { date: '5. Oct', activity: 30, lead: 18, win: 15 },
    { date: '7. Oct', activity: 28, lead: 22, win: 14 },
  ];

  const projectStatusData = [
    { name: 'นำเสนอบริษัท', value: 5 },
    { name: 'เสนอราคา', value: 10 },
    { name: 'ทดสอบสินค้า/ส่งตัวอย่าง', value: 3 },
    { name: 'อนุมัติราคา', value: 8 },
    { name: 'ปิดใบเสนอราคา', value: 2 },
  ];

  const paymentMethodData = [
    { name: 'เงินสด', value: 63.2, color: '#3b82f6' },
    { name: 'เครดิต', value: 36.8, color: '#f59e0b' },
  ];

  const productGroupData = [
    { name: 'PU40', value: 38.1 },
    { name: 'ซิลิโคนไร้กรด PU40', value: 17.9 },
    { name: 'Tiger Acrylic', value: 12.0 },
    { name: 'PU Foam', value: 11.3 },
    { name: 'น้ำยาทากระจก', value: 9.1 },
    { name: 'ซิลิโคนไร้กรด 6134', value: 3.9 },
    { name: 'ฟิล์มกันรอย', value: 3.2 },
    { name: 'MS 240a', value: 1.6 },
  ];

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">แผงบริหาร</h1>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 mb-3 md:mb-4">
          <div className="relative">
            <select className="w-full md:w-auto px-3 md:px-4 py-2 pr-10 border-2 border-orange-300 rounded-lg bg-orange-50 text-orange-800 font-medium appearance-none cursor-pointer hover:bg-orange-100 text-sm">
              <option>ทีม - กำหนดเอง</option>
            </select>
            <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              15
            </span>
          </div>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ผู้รับผิดชอบ - กำหนดเอง"
              className="w-full px-3 md:px-4 py-2 pr-10 border-2 border-purple-300 rounded-lg bg-purple-50 text-purple-800 font-medium placeholder-purple-600 text-sm"
            />
            <span className="absolute top-1 right-1 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              46
            </span>
          </div>
          
          <button className="px-4 md:px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-medium rounded-lg shadow-md hover:from-cyan-500 hover:to-cyan-600 text-sm">
            ค้นหาเพิ่มเติม
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4 overflow-x-auto">
          <div className="px-3 md:px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 font-medium text-gray-700 text-xs md:text-sm whitespace-nowrap">
            01 ต.ค. 2025 - 31 ต.ค. 2025
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-3 md:px-4 py-2 bg-pink-50 border-2 border-pink-300 text-pink-700 rounded-lg hover:bg-pink-100 text-xs md:text-sm font-medium whitespace-nowrap">วันนี้</button>
          <button className="px-3 md:px-4 py-2 bg-purple-50 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 text-xs md:text-sm font-medium whitespace-nowrap">เดือนนี้</button>
          <button className="px-3 md:px-4 py-2 bg-orange-50 border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 text-xs md:text-sm font-medium whitespace-nowrap">ไตรมาสนี้</button>
          <button className="px-3 md:px-4 py-2 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-100 text-xs md:text-sm font-medium whitespace-nowrap">ปีนี้</button>
          <button className="px-3 md:px-4 py-2 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-100 text-xs md:text-sm font-medium whitespace-nowrap">กำหนดเอง</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard
          title="จำนวนลูกค้าเคลื่อนไหว"
          value="41 / 1,597"
          change={17.14}
          trend="up"
          color="green"
          additionalInfo="35"
          icon={<Users className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="กิจกรรม"
          value="82"
          change={19.61}
          trend="down"
          color="red"
          additionalInfo="102"
          icon={<Activity className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="ยอดขาย (46)"
          value="334,978.59"
          subtitle="เฉลี่ย 7,282.14"
          change={35.35}
          trend="up"
          color="green"
          additionalInfo="ช่วงก่อน 247,490.21"
          icon={<DollarSign className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="ยอดขายรอส่ง (3)"
          value="160,182.06"
          subtitle="เฉลี่ย 53,394.02"
          change={13.35}
          trend="up"
          color="orange"
          additionalInfo="รอส่ง"
          icon={<Package className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="รอชำระเงิน (34)"
          value="262,376.20"
          subtitle="เฉลี่ย 7,716.95"
          color="blue"
          additionalInfo="ค้างรับ (วัน) 4"
          icon={<CreditCard className="w-4 h-4 text-white" />}
        />
        <KPICard
          title="คาดการณ์ยอดใหม่ (0)"
          value="0.00"
          subtitle="เฉลี่ย 0.00"
          change={0.00}
          trend="neutral"
          color="yellow"
          additionalInfo="~ 0.00"
          icon={<Star className="w-4 h-4 text-white" />}
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
            <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">0.01%</div>
            <div className="text-xs text-gray-500">35 / 451,613</div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">โอกาส</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">1,080.00%</div>
            <div className="text-xs text-gray-500">54 / 5</div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">ยอดขาย (รายได้)</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">100.00%</div>
            <div className="text-xs text-gray-500">334,978.59 / 0.00</div>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">กำไร(%)</div>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">100.00%</div>
            <div className="text-xs text-gray-500">334,978.59 / 0.00</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Status Pie Chart and Team Table */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">สถานะงาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {statusChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">ชื่อพนักงาน (7)</th>
                    <th className="px-2 py-2 text-center bg-gray-200">กิจกรรม</th>
                    <th className="px-2 py-2 text-center bg-blue-100">โครงการใหม่</th>
                    <th className="px-2 py-2 text-center bg-gray-200">เสนอราคา</th>
                    <th className="px-2 py-2 text-center bg-blue-100">ต่อรองราคา</th>
                    <th className="px-2 py-2 text-center">Lost</th>
                    <th className="px-2 py-2 text-center bg-green-100">Win</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salesTeamData.map((member, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-2 text-left font-medium">{member.name}</td>
                      <td className="px-2 py-2 text-center bg-gray-100">{member.total}</td>
                      <td className="px-2 py-2 text-center bg-blue-50">{member.new}</td>
                      <td className="px-2 py-2 text-center bg-gray-100">{member.quotation}</td>
                      <td className="px-2 py-2 text-center bg-blue-50">{member.negotiation} {member.negotiation > 0 && `(${member.negotiation})`}</td>
                      <td className="px-2 py-2 text-center">{member.lost}</td>
                      <td className="px-2 py-2 text-center bg-green-50 font-semibold">{member.win} {member.win > 5 && `(${member.win})`}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-600 text-white font-bold">
                    <td className="px-2 py-2 text-left">กำหนด</td>
                    <td className="px-2 py-2 text-center">82</td>
                    <td className="px-2 py-2 text-center">0</td>
                    <td className="px-2 py-2 text-center">10</td>
                    <td className="px-2 py-2 text-center">3(3)</td>
                    <td className="px-2 py-2 text-center">1</td>
                    <td className="px-2 py-2 text-center">45(4)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ความเคลื่อนไหว 01 ต.ค. 2025- 31 ต.ค. 2025</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activity" stroke="#6b7280" strokeWidth={2} name="ACTIVITY" />
              <Line type="monotone" dataKey="lead" stroke="#fbbf24" strokeWidth={2} name="LEAD" />
              <Line type="monotone" dataKey="win" stroke="#10b981" strokeWidth={2} name="WIN" />
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
            <div className="bg-gray-200 p-3 text-center font-bold rounded">ACTIVITY 86</div>
            <div className="bg-yellow-200 p-3 text-center font-bold rounded ml-4">LEAD 59</div>
            <div className="bg-orange-200 p-3 text-center font-bold rounded ml-8">QO 59 (3)</div>
            <div className="bg-green-200 p-3 text-center font-bold rounded ml-12">WIN 45 (4)</div>
          </div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>WIN : WIN Rate - โอกาส 76.27%</div>
            <div>WIN : WIN Rate - ใบเสนอราคา 76.27%</div>
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
              <p className="text-sm">saleprojects 2 Suchada</p>
              <p className="text-xs">06 October 2025 • 19:16</p>
              <p className="text-xs mt-2">ส่งน้อง รร SB</p>
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
              <div className="font-bold">5</div>
              <div className="text-xs text-gray-500">THB 7,384,888.93</div>
            </div>
            <div>
              <div className="text-gray-600">ยอดขายโครงการ</div>
              <div className="font-bold">16</div>
              <div className="text-xs text-gray-500">THB 2,912,487.48</div>
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
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
                {productGroupData.map((entry, index) => (
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
