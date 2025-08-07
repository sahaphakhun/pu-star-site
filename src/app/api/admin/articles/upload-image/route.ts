import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { cwd } from 'node:process';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - อัพโหลดรูปภาพสำหรับบทความ
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: กรุณาล็อกอินก่อน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const requester = decodedToken.phoneNumber || decodedToken.userId || '';
    const canUpload = await hasPermission(requester, PERMISSIONS.ARTICLES_IMAGES_UPLOAD);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์อัพโหลดรูปภาพ' },
        { status: 403 }
      );
    }

    // รับข้อมูลจาก form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ไม่พบไฟล์รูปภาพ' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'ประเภทไฟล์ไม่ถูกต้อง: รองรับเฉพาะ JPG, PNG, WebP และ GIF' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์ใหญ่เกินไป: สูงสุด 10MB' },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ใหม่
    const fileExtension = path.extname(file.name);
    const fileName = `${randomUUID()}${fileExtension}`;
    
    // กำหนดเส้นทางสำหรับบันทึกไฟล์
    const uploadDir = path.join(cwd(), 'public', 'uploads', 'articles');
    const filePath = path.join(uploadDir, fileName);
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // แปลงไฟล์เป็น buffer และบันทึก
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes as ArrayBuffer);
    
    await writeFile(filePath, buffer);

    // URL ของรูปภาพ (public path)
    const imageUrl = `/uploads/articles/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'อัพโหลดรูปภาพสำเร็จ',
      data: {
        url: imageUrl,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบรูปภาพ
export async function DELETE(request: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: กรุณาล็อกอินก่อน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const requester = decodedToken.phoneNumber || decodedToken.userId || '';
    const canUpload = await hasPermission(requester, PERMISSIONS.ARTICLES_IMAGES_UPLOAD);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์จัดการรูปภาพ' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl || !imageUrl.startsWith('/uploads/articles/')) {
      return NextResponse.json(
        { error: 'URL รูปภาพไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // แปลง URL เป็น file path
    const fileName = path.basename(imageUrl);
    const filePath = path.join(cwd(), 'public', 'uploads', 'articles', fileName);
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'ไม่พบไฟล์รูปภาพ' },
        { status: 404 }
      );
    }

    // ลบไฟล์
    await (await import('node:fs')).promises.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' },
      { status: 500 }
    );
  }
}