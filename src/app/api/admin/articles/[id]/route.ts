import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import { verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/constants/permissions';
import mongoose from 'mongoose';

// GET - ดึงบทความเดียว (สำหรับแอดมิน)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบการล็อกอิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: กรุณาล็อกอินก่อน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const canView = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_VIEW);
    if (!canView) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์ดูบทความ' },
        { status: 403 }
      );
    }

    // ตรวจสอบ ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID บทความไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    await connectDB();

    // ดึงบทความ
    const article = await Article.findById(id).lean();
    
    if (!article) {
      return NextResponse.json(
        { error: 'ไม่พบบทความที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { article }
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขบทความ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบการล็อกอิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: กรุณาล็อกอินก่อน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const canEdit = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_EDIT);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์แก้ไขบทความ' },
        { status: 403 }
      );
    }

    // ตรวจสอบ ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID บทความไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    await connectDB();

    // ตรวจสอบว่าบทความมีอยู่จริง
    const existingArticle = await Article.findById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'ไม่พบบทความที่ระบุ' },
        { status: 404 }
      );
    }

    // ถ้าแก้ไข slug ต้องตรวจสอบว่าไม่ซ้ำกับบทความอื่น
    if (body.slug && body.slug !== existingArticle.slug) {
      const duplicateSlug = await Article.findOne({ 
        slug: body.slug, 
        _id: { $ne: id } 
      });
      
      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'slug นี้ถูกใช้แล้ว กรุณาใช้ slug อื่น' },
          { status: 400 }
        );
      }
    }

    // ตรวจสอบสิทธิ์การเผยแพร่
    if (body.status === 'published' && existingArticle.status !== 'published') {
      const canPublish = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_PUBLISH);
      if (!canPublish) {
        return NextResponse.json(
          { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์เผยแพร่บทความ' },
          { status: 403 }
        );
      }
    }

    // เตรียมข้อมูลสำหรับอัพเดต
    const updateData = {
      ...body,
      updatedBy: decodedToken.phoneNumber
    };

    // ถ้าเป็นการเผยแพร่ครั้งแรก ให้กำหนด publishedAt
    if (body.status === 'published' && existingArticle.status !== 'published' && !existingArticle.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // อัพเดตบทความ
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขบทความสำเร็จ',
      data: { article: updatedArticle }
    });

  } catch (error: any) {
    console.error('Error updating article:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `ข้อมูลไม่ถูกต้อง: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { error: `${field} นี้ถูกใช้แล้ว` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขบทความ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบบทความ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบการล็อกอิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: กรุณาล็อกอินก่อน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const canDelete = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_DELETE);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์ลบบทความ' },
        { status: 403 }
      );
    }

    // ตรวจสอบ ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID บทความไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    await connectDB();

    // ตรวจสอบว่าบทความมีอยู่จริง
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json(
        { error: 'ไม่พบบทความที่ระบุ' },
        { status: 404 }
      );
    }

    // ลบบทความ
    await Article.findByIdAndDelete(id);

    // TODO: ลบรูปภาพที่เกี่ยวข้อง (ถ้ามี)
    
    return NextResponse.json({
      success: true,
      message: 'ลบบทความสำเร็จ'
    });

  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบบทความ' },
      { status: 500 }
    );
  }
}