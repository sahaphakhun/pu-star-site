'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
  isEditing: boolean;
  phoneNumber?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageUpload,
  isEditing,
  phoneNumber
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append('folder', 'profile-images');
      formData.append('public_id', `profile-${phoneNumber}-${Date.now()}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`การอัพโหลดรูปภาพล้มเหลว: ${response.status}`);
      }

      const data = await response.json();

      if (data.secure_url) {
        onImageUpload(data.secure_url);
        toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      } else {
        throw new Error('ไม่ได้รับ URL รูปภาพ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* รูปโปรไฟล์ */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt="รูปโปรไฟล์"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-4xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            </div>
          )}
        </div>

        {/* ปุ่มอัพโหลด */}
        {isEditing && (
          <div className="absolute bottom-0 right-0">
            <label className="cursor-pointer bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              {isUploading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
          </div>
        )}
      </div>

      {/* คำอธิบาย */}
      {isEditing && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 font-medium">
            คลิกปุ่มกล้องเพื่อเปลี่ยนรูปโปรไฟล์
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>JPG, PNG</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7l2.73-2.73A3 3 0 018.77 3h6.46a3 3 0 012.04 1.27L20 7M4 7h16" />
              </svg>
              <span>สูงสุด 5MB</span>
            </span>
          </div>
        </div>
      )}

      {/* แสดงสถานะเมื่อไม่ได้อยู่ในโหมดแก้ไข */}
      {!isEditing && (
        <p className="text-sm text-gray-500">
          {currentImageUrl ? 'รูปโปรไฟล์ของคุณ' : 'ยังไม่มีรูปโปรไฟล์'}
        </p>
      )}
    </div>
  );
};

export default ProfileImageUpload; 