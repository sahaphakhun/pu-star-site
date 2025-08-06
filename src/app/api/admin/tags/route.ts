import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tag from '@/models/Tag';
import { verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { updateTagArticleCount } from '@/app/api/tags/route';

// GET - ดึงรายการแท็กทั้งหมด (สำหรับแอดมิน)
export async function GET(request: NextRequest) {
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
    const canView = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_VIEW);
    if (!canView) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์ดูแท็ก' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // สร้าง query filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // คำนวณ skip สำหรับ pagination
    const skip = (page - 1) * limit;

    // สร้าง sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ดึงข้อมูลแท็ก
    const tags = await Tag.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // นับจำนวนทั้งหมด
    const totalCount = await Tag.countDocuments(filter);

    // คำนวณ pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        tags,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin tags:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก' },
      { status: 500 }
    );
  }
}

// POST - สร้างแท็กใหม่
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
    const canCreate = await hasPermission(decodedToken.phoneNumber, PERMISSIONS.ARTICLES_CREATE);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์สร้างแท็ก' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation
    const requiredFields = ['name', 'slug'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `ข้อมูลไม่ครบถ้วน: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const existingTag = await Tag.findOne({ slug: body.slug });
    if (existingTag) {
      return NextResponse.json(
        { error: 'slug นี้ถูกใช้แล้ว' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลแท็ก
    const tagData = {
      ...body,
      articleCount: 0,
      createdBy: decodedToken.phoneNumber,
      updatedBy: decodedToken.phoneNumber
    };

    // สร้างแท็กใหม่
    const newTag = new Tag(tagData);
    await newTag.save();

    return NextResponse.json({
      success: true,
      message: 'สร้างแท็กสำเร็จ',
      data: { tag: newTag }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating tag:', error);
    
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
      { error: 'เกิดข้อผิดพลาดในการสร้างแท็ก' },
      { status: 500 }
    );
  }
}