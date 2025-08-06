import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article, { IArticle } from '@/models/Article';
import { verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/constants/permissions';

// GET - ดึงรายการบทความทั้งหมด (สำหรับแอดมิน)
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
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์ดูบทความ' },
        { status: 403 }
      );
    }

    await connectDB();

    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // สร้าง query filter
    const filter: any = {};
    
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      filter.status = status;
    }
    
    if (tags && tags.length > 0) {
      filter['tags.slug'] = { $in: tags };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { 'tags.name': { $regex: search, $options: 'i' } }
      ];
    }

    // คำนวณ skip สำหรับ pagination
    const skip = (page - 1) * limit;

    // สร้าง sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ดึงข้อมูลบทความ
    const articles = await Article.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-content') // ไม่ดึง content ในหน้า list
      .lean();

    // นับจำนวนทั้งหมด
    const totalCount = await Article.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // สถิติพื้นฐาน
    const stats = await Article.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      draft: 0,
      published: 0,
      archived: 0
    };

    stats.forEach(stat => {
      if (statusStats.hasOwnProperty(stat._id)) {
        statusStats[stat._id as keyof typeof statusStats] = stat.count;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        stats: statusStats
      }
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ' },
      { status: 500 }
    );
  }
}

// POST - สร้างบทความใหม่
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
        { error: 'ไม่ได้รับอนุญาต: ไม่มีสิทธิ์สร้างบทความ' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation
    const requiredFields = ['title', 'slug', 'excerpt', 'seo'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `ข้อมูลไม่ครบถ้วน: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const existingArticle = await Article.findOne({ slug: body.slug });
    if (existingArticle) {
      return NextResponse.json(
        { error: 'slug นี้ถูกใช้แล้ว กรุณาใช้ slug อื่น' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลบทความ
    const articleData = {
      ...body,
      author: {
        name: body.author?.name || 'ทีมงาน PU STAR',
        email: body.author?.email,
        avatar: body.author?.avatar
      },
      content: body.content || [],
      tags: body.tags || [],
      status: body.status || 'draft',
      viewCount: 0,
      relatedArticles: body.relatedArticles || [],
      comments: {
        enabled: body.comments?.enabled !== false,
        count: 0
      },
      createdBy: decodedToken.phoneNumber || decodedToken.userId,
      updatedBy: decodedToken.phoneNumber || decodedToken.userId
    };

    // สร้างบทความใหม่
    const newArticle = new Article(articleData);
    await newArticle.save();

    return NextResponse.json({
      success: true,
      message: 'สร้างบทความสำเร็จ',
      data: { article: newArticle }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating article:', error);
    
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
      { error: 'เกิดข้อผิดพลาดในการสร้างบทความ' },
      { status: 500 }
    );
  }
}