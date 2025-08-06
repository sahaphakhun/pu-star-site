import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

// GET - ดึงรายการบทความที่เผยแพร่แล้ว (สำหรับ public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean); // รองรับหลายแท็ก
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'publishedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // สร้าง query filter สำหรับบทความที่เผยแพร่แล้ว
    const filter: any = {
      status: 'published',
      $or: [
        { publishedAt: { $lte: new Date() } },
        { scheduledAt: { $lte: new Date() } }
      ]
    };
    
    if (tags && tags.length > 0) {
      filter['tags.slug'] = { $in: tags }; // เปลี่ยนเป็น tags.slug
    }
    
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { 'tags.name': { $regex: search, $options: 'i' } } // ค้นหาในชื่อแท็ก
        ]
      });
    }

    // คำนวณ skip สำหรับ pagination
    const skip = (page - 1) * limit;

    // สร้าง sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ดึงข้อมูลบทความ (ไม่รวม content สำหรับหน้า list)
    const articles = await Article.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-content -createdBy -updatedBy')
      .lean();

    // นับจำนวนทั้งหมด
    const totalCount = await Article.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // ดึงแท็กยอดนิยม (แท็กที่มีบทความมากที่สุด 10 อันดับแรก)
    const popularTags = await Article.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags.slug', 
        name: { $first: '$tags.name' },
        slug: { $first: '$tags.slug' },
        color: { $first: '$tags.color' },
        articleCount: { $sum: 1 }
      }},
      { $sort: { articleCount: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        popularTags,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
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