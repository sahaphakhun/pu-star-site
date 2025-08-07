import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

// GET - ดึงบทความเดียวจาก slug (สำหรับ public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'ไม่ได้ระบุ slug ของบทความ' },
        { status: 400 }
      );
    }

    await connectDB();

    // ดึงบทความจาก slug
    const article = await Article.findOne({ 
      slug,
      status: 'published',
      $or: [
        { publishedAt: { $lte: new Date() } },
        { scheduledAt: { $lte: new Date() } },
        { $and: [
            { publishedAt: { $exists: false } },
            { scheduledAt: { $exists: false } }
          ]
        }
      ]
    })
    .select('-createdBy -updatedBy')
    .lean();
    
    if (!article) {
      return NextResponse.json(
        { error: 'ไม่พบบทความที่ระบุ' },
        { status: 404 }
      );
    }

    // เพิ่มจำนวนการดู (ไม่ต้องรอ)
    Article.findByIdAndUpdate(
      article._id, 
      { $inc: { viewCount: 1 } }
    ).exec().catch(err => console.error('Error updating view count:', err));

    // ดึงบทความที่เกี่ยวข้อง
    let relatedArticles: any[] = [];
    
    if (article.relatedArticles && article.relatedArticles.length > 0) {
      // ถ้ามีการระบุบทความที่เกี่ยวข้องไว้
      relatedArticles = await Article.find({
        _id: { $in: article.relatedArticles },
        status: 'published'
      })
      .select('title slug excerpt featuredImage publishedAt readingTime tags')
      .limit(3)
      .lean();
    }
    
    // ถ้ายังไม่ครบ 3 บทความ ให้หาโดยแท็กเดียวกัน
    if (relatedArticles.length < 3 && Array.isArray(article.tags) && article.tags.length > 0) {
      const tagSlugs = article.tags.map((t: any) => t.slug || t);
      const additionalArticles = await Article.find({
        _id: { 
          $ne: article._id,
          $nin: relatedArticles.map(a => a._id)
        },
        'tags.slug': { $in: tagSlugs },
        status: 'published'
      })
      .select('title slug excerpt featuredImage publishedAt readingTime tags')
      .sort({ publishedAt: -1 })
      .limit(3 - relatedArticles.length)
      .lean();
      relatedArticles = [...relatedArticles, ...additionalArticles];
    }
    
    // ถ้ายังไม่ครบ 3 บทความ ให้หาบทความล่าสุด
    if (relatedArticles.length < 3) {
      const latestArticles = await Article.find({
        _id: { 
          $ne: article._id,
          $nin: relatedArticles.map(a => a._id)
        },
        status: 'published'
      })
      .select('title slug excerpt featuredImage publishedAt readingTime tags')
      .sort({ publishedAt: -1 })
      .limit(3 - relatedArticles.length)
      .lean();
      
      relatedArticles = [...relatedArticles, ...latestArticles];
    }

    // ดึงบทความก่อนหน้าและถัดไปตามวันที่เผยแพร่
    const [previousArticle, nextArticle] = await Promise.all([
      Article.findOne({
        publishedAt: { $lt: article.publishedAt },
        status: 'published'
      })
      .select('title slug')
      .sort({ publishedAt: -1 })
      .lean(),
      
      Article.findOne({
        publishedAt: { $gt: article.publishedAt },
        status: 'published'
      })
      .select('title slug')
      .sort({ publishedAt: 1 })
      .lean()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        article,
        relatedArticles,
        navigation: {
          previous: previousArticle,
          next: nextArticle
        }
      }
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ' },
      { status: 500 }
    );
  }
}

// POST - เพิ่มจำนวนการดู (สำหรับ analytics)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'ไม่ได้ระบุ slug ของบทความ' },
        { status: 400 }
      );
    }

    await connectDB();

    // เพิ่มจำนวนการดู
    const result = await Article.findOneAndUpdate(
      { 
        slug,
        status: 'published'
      },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'ไม่พบบทความที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        viewCount: result.viewCount
      }
    });

  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดตจำนวนการดู' },
      { status: 500 }
    );
  }
}