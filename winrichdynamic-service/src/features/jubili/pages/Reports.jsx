"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/features/jubili/context/DataContext';
import { 
  FileText, 
  Database, 
  FolderOpen, 
  Download, 
  Eye, 
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const Reports = () => {
  const { reports } = useData();
  const [activeTab, setActiveTab] = useState('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Report form state
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [format, setFormat] = useState('pdf');
  const [reportParams, setReportParams] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Report types configuration
  const reportTypes = [
    { 
      id: 'performance', 
      name: 'รายงานประสิทธิภาพการขาย', 
      description: 'สรุปประสิทธิภาพการขายของพนักงานและทีม',
      endpoint: '/api/reports/performance',
      params: ['team', 'ownerId']
    },
    { 
      id: 'deals-by-stage', 
      name: 'รายงานการขายตามขั้นตอน', 
      description: 'สรุปยอดการขายแยกตามขั้นตอนใน Pipeline',
      endpoint: '/api/reports/deals-by-stage',
      params: ['team', 'ownerId', 'stageId']
    },
    { 
      id: 'sales-summary', 
      name: 'รายงานสรุปยอดขาย', 
      description: 'สรุปยอดขายรายเดือน/ปี',
      endpoint: '/api/reports/sales-summary',
      params: ['groupBy']
    },
    { 
      id: 'customer-analysis', 
      name: 'รายงานวิเคราะห์ลูกค้า', 
      description: 'วิเคราะห์พฤติกรรมและข้อมูลลูกค้า',
      endpoint: '/api/reports/customer-analysis',
      params: ['customerType', 'region']
    },
    { 
      id: 'activity-report', 
      name: 'รายงานกิจกรรมการขาย', 
      description: 'สรุปกิจกรรมการขายของพนักงาน',
      endpoint: '/api/reports/activity-report',
      params: ['activityType', 'ownerId']
    },
    { 
      id: 'product-sales', 
      name: 'รายงานยอดขายสินค้า', 
      description: 'สรุปยอดขายแยกตามสินค้า',
      endpoint: '/api/reports/product-sales',
      params: ['productCategory', 'timeRange']
    }
  ];

  // Format options
  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];

  // Team options (mock data)
  const teamOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'Trade Sales Team', label: 'Trade Sales Team' },
    { value: 'Project Sales Team', label: 'Project Sales Team' },
    { value: 'PU STAR Office', label: 'PU STAR Office' }
  ];

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('b2b_token') || '';
    }
    return '';
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!reportType) {
      setError('กรุณาเลือกประเภทรายงาน');
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      setError('กรุณาเลือกช่วงวันที่');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const selectedReport = reportTypes.find(r => r.id === reportType);
      const params = new URLSearchParams();
      
      // Add date range
      params.append('start', dateRange.from.toISOString());
      params.append('end', dateRange.to.toISOString());
      
      // Add report-specific parameters
      Object.keys(reportParams).forEach(key => {
        if (reportParams[key] && reportParams[key] !== 'all') {
          params.append(key, reportParams[key]);
        }
      });

      const response = await fetch(`${selectedReport.endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถสร้างรายงานได้');
      }

      const data = await response.json();
      
      // Handle different formats
      if (format === 'csv') {
        // For CSV, use the export endpoint
        await handleCSVExport();
      } else {
        // For PDF and Excel, store the data for preview/download
        const reportData = {
          id: Date.now(),
          type: reportType,
          typeName: selectedReport.name,
          format: format,
          dateRange: {
            from: format(dateRange.from, 'dd MMM yyyy', { locale: th }),
            to: format(dateRange.to, 'dd MMM yyyy', { locale: th })
          },
          data: data,
          generatedAt: new Date().toISOString()
        };

        setGeneratedReports(prev => [reportData, ...prev]);
        setPreviewData(reportData);
        setShowPreview(true);
        setSuccess('สร้างรายงานสำเร็จแล้ว');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle CSV export
  const handleCSVExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('start', dateRange.from.toISOString());
      params.append('end', dateRange.to.toISOString());
      
      // Add report-specific parameters
      Object.keys(reportParams).forEach(key => {
        if (reportParams[key] && reportParams[key] !== 'all') {
          params.append(key, reportParams[key]);
        }
      });

      const response = await fetch(`/api/reports/export.csv?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถส่งออก CSV ได้');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('ส่งออกไฟล์ CSV สำเร็จแล้ว');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกไฟล์');
    }
  };

  // Handle download
  const handleDownload = (report) => {
    // In a real implementation, this would generate and download the file
    // For now, we'll simulate the download
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.typeName}-${report.format}-${format(new Date(), 'yyyyMMdd')}.${report.format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle preview
  const handlePreview = (report) => {
    setPreviewData(report);
    setShowPreview(true);
  };

  // Reset form
  const resetForm = () => {
    setReportType('');
    setDateRange({ from: null, to: null });
    setFormat('pdf');
    setReportParams({});
    setError('');
    setSuccess('');
  };

  // Get selected report type configuration
  const selectedReportConfig = reportTypes.find(r => r.id === reportType);

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'generate'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText size={20} />
          สร้างรายงาน
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'reports'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Database size={20} />
          รายงานที่สร้างแล้ว
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            activeTab === 'storage'
              ? 'bg-white shadow-md text-gray-800 font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FolderOpen size={20} />
          คลังข้อมูล
        </button>
      </div>

      {/* Content */}
      {activeTab === 'generate' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">สร้างรายงานใหม่</h2>
          
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Type Selection */}
            <div>
              <Label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทรายงาน
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทรายงาน" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportConfig && (
                <p className="mt-2 text-sm text-gray-600">{selectedReportConfig.description}</p>
              )}
            </div>

            {/* Format Selection */}
            <div>
              <Label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                รูปแบบไฟล์
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรูปแบบไฟล์" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selection */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงวันที่
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar size={18} className="mr-2" />
                      {dateRange.from ? format(dateRange.from, 'dd MMM yyyy', { locale: th }) : 'วันที่เริ่มต้น'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar size={18} className="mr-2" />
                      {dateRange.to ? format(dateRange.to, 'dd MMM yyyy', { locale: th }) : 'วันที่สิ้นสุด'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Report Parameters */}
            {selectedReportConfig && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter size={18} className="inline mr-1" />
                  ตัวกรองเพิ่มเติม
                </Label>
                
                {selectedReportConfig.params.includes('team') && (
                  <div className="mb-3">
                    <Select value={reportParams.team || ''} onValueChange={(value) => setReportParams(prev => ({ ...prev, team: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกทีม" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamOptions.map((team) => (
                          <SelectItem key={team.value} value={team.value}>
                            {team.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedReportConfig.params.includes('ownerId') && (
                  <div className="mb-3">
                    <Input
                      placeholder="รหัสพนักงาน"
                      value={reportParams.ownerId || ''}
                      onChange={(e) => setReportParams(prev => ({ ...prev, ownerId: e.target.value }))}
                    />
                  </div>
                )}
                
                {selectedReportConfig.params.includes('stageId') && (
                  <div className="mb-3">
                    <Input
                      placeholder="รหัสขั้นตอน"
                      value={reportParams.stageId || ''}
                      onChange={(e) => setReportParams(prev => ({ ...prev, stageId: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportType || !dateRange.from || !dateRange.to}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังสร้างรายงาน...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  สร้างรายงาน
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex items-center gap-2"
            >
              รีเซ็ต
            </Button>
          </div>
        </div>
      ) : activeTab === 'reports' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">รายงานที่สร้างแล้ว</h2>
          
          {generatedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">ยังไม่มีรายงานที่สร้างแล้ว</p>
              <Button
                onClick={() => setActiveTab('generate')}
                className="mt-4"
              >
                สร้างรายงานใหม่
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{report.typeName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        ช่วงวันที่: {report.dateRange.from} - {report.dateRange.to}
                      </p>
                      <p className="text-sm text-gray-600">
                        รูปแบบ: {report.format.toUpperCase()} | 
                        สร้างเมื่อ: {format(new Date(report.generatedAt), 'dd MMM yyyy HH:mm', { locale: th })}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(report)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        ดูตัวอย่าง
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(report)}
                        className="flex items-center gap-1"
                      >
                        <Download size={16} />
                        ดาวน์โหลด
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ฟีเจอร์นี้กำลังพัฒนา
          </h2>
          <p className="text-gray-600">
            คลังข้อมูลจะเปิดให้ใช้งานเร็วๆ นี้
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">ตัวอย่างรายงาน: {previewData.typeName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  ช่วงวันที่: {previewData.dateRange.from} - {previewData.dateRange.to}
                </p>
                <p className="text-sm text-gray-600">
                  รูปแบบ: {previewData.format.toUpperCase()}
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(previewData.data, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                ปิด
              </Button>
              <Button
                onClick={() => handleDownload(previewData)}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                ดาวน์โหลด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
