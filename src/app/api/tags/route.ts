import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tag from '@/models/Tag';
import Article from '@/models/Article';

// GET - ดึงรายการแท็กทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'articleCount';
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
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก' },
      { status: 500 }
    );
  }
}

// GET - ดึงแท็กที่ได้รับความนิยม (สำหรับแสดงในหน้าหลัก)
export async function getPopularTags(limit: number = 10) {
  try {
    await connectDB();
    
    const popularTags = await Tag.find({ articleCount: { $gt: 0 } })
      .sort({ articleCount: -1 })
      .limit(limit)
      .select('name slug color articleCount')
      .lean();

    return popularTags;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับอัปเดตจำนวนบทความในแท็ก
export async function updateTagArticleCount(tagSlug: string) {
  try {
    await connectDB();
    
    const articleCount = await Article.countDocuments({
      'tags.slug': tagSlug,
      status: 'published'
    });

    await Tag.findOneAndUpdate(
      { slug: tagSlug },
      { articleCount },
      { new: true }
    );

    return articleCount;
  } catch (error) {
    console.error('Error updating tag article count:', error);
    return 0;
  }
}