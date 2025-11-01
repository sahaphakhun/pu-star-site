'use client';

import React, { useEffect, useState } from 'react';
import PDFViewer from '@/components/PDFViewer';
import PDFPreview from '@/components/PDFPreview';
import ImageGallery from '@/components/ImageGallery';

interface CatalogItem {
  _id: string;
  title: string;
  displayName?: string; // ชื่อที่แสดงให้ลูกค้าเห็น
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  // สำหรับชุดรูปภาพ
  isImageSet?: boolean;
  imageUrls?: string[];
  imageCount?: number;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data?.items) setItems(data.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPEG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image',
      'application/zip': 'ZIP Archive'
    };
    return typeMap[item.fileType] || item.fileType;
  };

  const isImageFile = (fileType?: string) => {
    return fileType?.startsWith('image/');
  };

  const isPDFFile = (fileType?: string) => {
    return fileType === 'application/pdf';
  };

  const isImageSet = (item: CatalogItem) => {
    return item.isImageSet && item.imageUrls && item.imageUrls.length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">แคตตาล็อกสินค้า</h1>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">ยังไม่มีไฟล์แคตตาล็อก</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {item.category}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {getFileTypeLabel(item)}
                    </div>
                    {item.fileSize && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7c0-2.21-3.582-4-8-4s-8 1.79-8 4z" />
                        </svg>
                        {formatFileSize(item.fileSize)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  {/* แสดงปุ่มตามประเภทไฟล์ */}
                  {isImageSet(item) && (
                    <ImageGallery 
                      images={item.imageUrls!} 
                      title={item.displayName || item.title} 
                    />
                  )}
                  {isPDFFile(item.fileType) && (
                    <PDFPreview 
                      fileUrl={item.fileUrl} 
                      title={item.displayName || item.title} 
                      fileType={item.fileType}
                    />
                  )}
                  {isImageFile(item.fileType) && !isImageSet(item) && (
                    <PDFPreview 
                      fileUrl={item.fileUrl} 
                      title={item.displayName || item.title} 
                      fileType={item.fileType}
                    />
                  )}
                  <PDFViewer 
                    fileUrl={item.fileUrl} 
                    title={item.displayName || item.title} 
                    fileType={item.fileType} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


