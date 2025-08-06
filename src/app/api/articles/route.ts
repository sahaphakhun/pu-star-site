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
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
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
    
    if (category) {
      filter['category.slug'] = category;
    }
    
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
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

    // ดึงหมวดหมู่ที่มีบทความ
    const categories = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { '_id.name': 1 } }
    ]);

    // ดึงแท็กที่นิยม
    const popularTags = await Article.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

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
        categories: categories.map(cat => ({
          name: cat._id.name,
          slug: cat._id.slug,
          count: cat.count,
          color: cat._id.color
        })),
        popularTags: popularTags.map(tag => ({
          name: tag._id,
          count: tag.count
        }))
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