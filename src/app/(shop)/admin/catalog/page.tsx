'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CatalogItem {
  _id: string;
  title: string;
  displayName?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  isImageSet?: boolean;
  imageUrls?: string[];
  imageCount?: number;
  createdAt: string;
}

export default function AdminCatalogPage() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [isImageSet, setIsImageSet] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data?.items) setItems(data.items);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('กรุณาระบุชื่อไฟล์');
      return;
    }

    if (isImageSet) {
      if (selectedFiles.length === 0) {
        alert('กรุณาเลือกรูปภาพอย่างน้อย 1 ไฟล์');
        return;
      }
    } else {
      if (!selectedFile) {
        alert('กรุณาเลือกไฟล์');
        return;
      }
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (displayName.trim()) {
        formData.append('displayName', displayName);
      }
      if (category.trim()) {
        formData.append('category', category);
      }
      formData.append('isImageSet', isImageSet.toString());

      if (isImageSet) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', selectedFile!);
      }

      const res = await fetch('/api/catalog', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        alert('อัปโหลดสำเร็จ');
        resetForm();
        loadItems();
        setShowUploadForm(false);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDisplayName('');
    setCategory('');
    setIsImageSet(false);
    setSelectedFile(null);
    setSelectedFiles([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบไฟล์นี้หรือไม่?')) return;

    try {
      const res = await fetch(`/api/catalog?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (data.success) {
        alert('ลบสำเร็จ');
        loadItems();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeLabel = (item: CatalogItem) => {
    if (item.isImageSet) {
      return `ชุดรูปภาพ (${item.imageCount} ภาพ)`;
    }
    
    if (!item.fileType) return '';
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/vnd.ms-excel': 'Excel',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'application/zip': 'ZIP'
    };
    return typeMap[item.fileType] || item.fileType;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการแคตตาล็อก</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showUploadForm ? 'ปิดฟอร์ม' : 'เพิ่มไฟล์ใหม่'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">อัปโหลดไฟล์ใหม่</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อไฟล์ (ชื่อจริง) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อไฟล์จริง"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อที่แสดง (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อที่ลูกค้าเห็น"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น สินค้าใหม่, โปรโมชั่น"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทการอัปโหลด
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isImageSet}
                      onChange={() => setIsImageSet(false)}
                      className="mr-2"
                    />
                    ไฟล์เดียว
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isImageSet}
                      onChange={() => setIsImageSet(true)}
                      className="mr-2"
                    />
                    ชุดรูปภาพ
                  </label>
                </div>
              </div>
            </div>

            {!isImageSet ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกไฟล์ *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.zip"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  รองรับ: PDF, Word, Excel, รูปภาพ, ZIP
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกรูปภาพหลายไฟล์ *
                </label>
                <input
                  type="file"
                  onChange={handleFilesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept="image/*"
                  multiple
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  เลือกรูปภาพหลายไฟล์เพื่อสร้างชุดรูปภาพ
                </p>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    เลือกแล้ว {selectedFiles.length} ไฟล์
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                รีเซ็ต
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">ไฟล์ทั้งหมด ({items.length})</h2>
        </div>
        
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            ยังไม่มีไฟล์
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {item.displayName || item.title}
                    </h3>
                    {item.displayName && item.displayName !== item.title && (
                      <p className="text-sm text-gray-500 mb-2">ชื่อไฟล์: {item.title}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {item.category && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {item.category}
                        </span>
                      )}
                      <span className="text-gray-600">
                        {getFileTypeLabel(item)}
                      </span>
                      {item.fileSize && (
                        <span className="text-gray-600">
                          ขนาด: {formatFileSize(item.fileSize)}
                        </span>
                      )}
                      <span className="text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


