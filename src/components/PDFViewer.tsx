'use client';

import React from 'react';

interface PDFViewerProps {
  fileUrl: string;
  title: string;
  fileType?: string;
}

export default function PDFViewer({ fileUrl, title, fileType }: PDFViewerProps) {
  const isPDF = fileType === 'application/pdf';
  const isImage = fileType?.startsWith('image/');
  
  const handleOpenFile = () => {
    if (isPDF) {
      // เปิดไฟล์ PDF ในหน้าต่างใหม่
      window.open(fileUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } else if (isImage) {
      // สำหรับรูปภาพ ให้ดาวน์โหลด
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // สำหรับไฟล์อื่นๆ ให้ดาวน์โหลด
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getButtonText = () => {
    if (isPDF) {
      return 'เปิดดู';
    } else if (isImage) {
      return 'ดาวน์โหลด';
    }
    return 'ดาวน์โหลด';
  };

  const getButtonIcon = () => {
    if (isPDF) {
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    } else if (isImage) {
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getButtonColor = () => {
    if (isPDF) {
      return 'bg-green-600 hover:bg-green-700';
    } else if (isImage) {
      return 'bg-orange-600 hover:bg-orange-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <button
      onClick={handleOpenFile}
      className={`px-3 py-1.5 rounded-md text-white text-sm hover:opacity-90 transition-opacity flex items-center ${getButtonColor()}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </button>
  );
}
