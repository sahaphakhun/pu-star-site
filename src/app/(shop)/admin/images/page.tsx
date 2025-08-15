'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface UploadedImage {
  _id: string;
  publicId: string;        // Cloudinary public ID
  filename: string;        // ชื่อไฟล์เดิม
  originalName: string;    // ชื่อไฟล์เดิม
  url: string;            // Cloudinary URL
  secureUrl: string;      // Cloudinary secure URL
  size: number;           // ขนาดไฟล์ (bytes)
  mimetype: string;       // ประเภทไฟล์
  width: number;          // ความกว้างรูปภาพ
  height: number;         // ความสูงรูปภาพ
  format: string;         // รูปแบบไฟล์ (jpg, png, etc.)
  uploadedBy: string;     // ผู้อัพโหลด
  uploadedAt: string;     // วันที่อัพโหลด
  category?: string;      // หมวดหมู่
  tags?: string[];        // แท็ก
  isPublic?: boolean;     // สถานะ public/private
  cloudinaryData?: any;   // ข้อมูลเพิ่มเติมจาก Cloudinary
}

const ImageManagementPage: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // หมวดหมู่ภาพ
  const categories = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'products', label: 'สินค้า' },
    { value: 'reviews', label: 'รีวิว' },
    { value: 'banners', label: 'แบนเนอร์' },
    { value: 'others', label: 'อื่นๆ' }
  ];

  // โหลดรายการภาพ
  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        toast.error('ไม่สามารถโหลดรายการภาพได้');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดภาพ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // จัดการการลากไฟล์
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  // จัดการการเลือกไฟล์
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  // ลบไฟล์ที่เลือก
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // อัพโหลดภาพ
  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error('กรุณาเลือกไฟล์ภาพ');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
        formData.append(`categories[${index}]`, selectedCategory === 'all' ? 'others' : selectedCategory);
      });

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`อัพโหลดภาพสำเร็จ ${result.uploadedCount} ไฟล์`);
        setSelectedFiles([]);
        setShowUploadModal(false);
        loadImages(); // โหลดรายการใหม่
      } else {
        const error = await response.json();
        toast.error(error.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  // ลบภาพ
  const deleteImage = async (imageId: string) => {
    if (!confirm('คุณต้องการลบภาพนี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('ลบภาพสำเร็จ');
        loadImages(); // โหลดรายการใหม่
      } else {
        toast.error('ไม่สามารถลบภาพได้');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('เกิดข้อผิดพลาดในการลบภาพ');
    }
  };

  // สลับสถานะ public/private
  const togglePublicStatus = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/images/${imageId}/toggle-public`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('เปลี่ยนสถานะสำเร็จ');
        loadImages(); // โหลดรายการใหม่
      } else {
        toast.error('ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // คัดกรองภาพ
  const filteredImages = images.filter(image => {
    const matchesSearch = image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // คัดลอกลิงก์ภาพ
  const copyImageLink = (image: UploadedImage) => {
    const url = image.secureUrl || image.url;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('คัดลอกลิงก์ภาพแล้ว');
    }).catch(() => {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    });
  };

  // คัดลอกโค้ด [SEND_IMAGE:...]
  const copySendImageCode = (image: UploadedImage) => {
    const url = image.secureUrl || image.url;
    const code = `[SEND_IMAGE:${url}]`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success('คัดลอกโค้ด [SEND_IMAGE:...] แล้ว');
    }).catch(() => {
      toast.error('ไม่สามารถคัดลอกโค้ดได้');
    });
  };

  // แปลงขนาดไฟล์
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการภาพ</h1>
          <p className="text-gray-600">อัพโหลดและจัดการภาพสำหรับใช้กับระบบ [SEND_IMAGE:...]</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>อัพโหลดภาพ</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ค้นหาภาพ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีภาพ</h3>
          <p className="mt-1 text-sm text-gray-500">เริ่มต้นโดยการอัพโหลดภาพใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={image.secureUrl || image.url}
                  alt={image.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => copyImageLink(image)}
                    className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                    title="คัดลอกลิงก์"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => copySendImageCode(image)}
                    className="bg-blue-600 bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                    title="คัดลอกโค้ด [SEND_IMAGE:...]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => togglePublicStatus(image._id)}
                    className={`${image.isPublic ? 'bg-green-600' : 'bg-yellow-600'} bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75`}
                    title={image.isPublic ? 'เปลี่ยนเป็น Private' : 'เปลี่ยนเป็น Public'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={image.isPublic ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"} />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteImage(image._id)}
                    className="bg-red-600 bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                    title="ลบภาพ"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{image.originalName}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(image.size)} • {image.width}×{image.height} • {image.format?.toUpperCase()}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {image.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {image.category}
                    </span>
                  )}
                  <span className={`inline-block text-xs px-2 py-1 rounded ${
                    image.isPublic 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {image.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                    Cloudinary
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  อัพโหลดเมื่อ {new Date(image.uploadedAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">อัพโหลดภาพ</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                ลากไฟล์ภาพมาที่นี่ หรือ{' '}
                <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                  เลือกไฟล์
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 10MB
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">ไฟล์ที่เลือก ({selectedFiles.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.filter(cat => cat.value !== 'all').map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={uploadImages}
                disabled={uploading || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>กำลังอัพโหลด...</span>
                  </>
                ) : (
                  <span>อัพโหลด</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagementPage;
