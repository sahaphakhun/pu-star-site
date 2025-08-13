'use client';

import React, { useState } from 'react';

interface PDFPreviewProps {
  fileUrl: string;
  title: string;
  fileType?: string;
}

export default function PDFPreview({ fileUrl, title, fileType }: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPDF = fileType === 'application/pdf';
  const isImage = fileType?.startsWith('image/');

  const openPreview = () => {
    setIsOpen(true);
  };

  const closePreview = () => {
    setIsOpen(false);
  };

  // สำหรับรูปภาพเดี่ยว ให้แสดงปุ่มตัวอย่าง
  if (isImage) {
    return (
      <button
        onClick={openPreview}
        className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        ตัวอย่าง
      </button>
    );
  }

  // สำหรับไฟล์ที่ไม่ใช่ PDF หรือรูปภาพ ไม่แสดงปุ่มตัวอย่าง
  if (!isPDF) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={openPreview}
        className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        ตัวอย่าง
      </button>
    );
  }

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={closePreview}
      >
        {/* Modal Content */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={closePreview}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4">
            {isPDF ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full min-h-[70vh] border border-gray-200 rounded"
                title={title}
              />
            ) : isImage ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={fileUrl}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
            ) : null}
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={closePreview}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ปิด
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              เปิดในแท็บใหม่
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
