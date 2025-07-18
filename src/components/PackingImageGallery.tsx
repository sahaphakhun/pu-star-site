'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PackingProof {
  url: string;
  type: 'image' | 'video';
  addedAt: Date;
}

interface PackingImageGalleryProps {
  orderId: string;
  packingProofs: PackingProof[];
  isAdmin?: boolean;
  onImagesUpdated?: (proofs: PackingProof[]) => void;
}

const PackingImageGallery: React.FC<PackingImageGalleryProps> = ({
  orderId,
  packingProofs = [],
  isAdmin = false,
  onImagesUpdated
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentCount = packingProofs.length;
    const newFilesCount = files.length;

    if (currentCount + newFilesCount > 10) {
      alert(`สามารถอัพโหลดได้อีก ${10 - currentCount} รูปเท่านั้น`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/orders/${orderId}/upload-packing-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // อัปเดตรายการรูปภาพ
        const updatedProofs = [...packingProofs, ...data.packingProofs];
        onImagesUpdated?.(updatedProofs);
        
        // Reset input
        event.target.value = '';
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้?')) return;

    setDeleting(imageUrl);

    try {
      const response = await fetch(`/api/orders/${orderId}/delete-packing-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // อัปเดตรายการรูปภาพ
        const updatedProofs = packingProofs.filter(proof => proof.url !== imageUrl);
        onImagesUpdated?.(updatedProofs);
        
        // ปิด modal หากรูปที่ลบคือรูปที่กำลังดู
        if (selectedImage === imageUrl) {
          setSelectedImage(null);
        }
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบรูปภาพ');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          รูปภาพหลักฐานการแพ็ก ({packingProofs.length}/10)
        </h3>
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id={`packing-upload-${orderId}`}
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading || packingProofs.length >= 10}
              className="hidden"
            />
            <label
              htmlFor={`packing-upload-${orderId}`}
              className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                uploading || packingProofs.length >= 10
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {uploading ? 'กำลังอัพโหลด...' : 'เพิ่มรูปภาพ'}
            </label>
            <span className="text-sm text-gray-500">
              (สูงสุด {10 - packingProofs.length} รูป)
            </span>
          </div>
        )}
      </div>

      {packingProofs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ยังไม่มีรูปภาพหลักฐานการแพ็ก
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {packingProofs.map((proof, index) => (
            <div key={proof.url} className="relative group">
              <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <Image
                  src={proof.url}
                  alt={`หลักฐานการแพ็ก ${index + 1}`}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={() => setSelectedImage(proof.url)}
                />
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteImage(proof.url)}
                    disabled={deleting === proof.url}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting === proof.url ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {formatDate(proof.addedAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal สำหรับดูรูปภาพขนาดใหญ่ */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={selectedImage}
              alt="รูปภาพหลักฐานการแพ็ก"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingImageGallery; 