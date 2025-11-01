import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookPost from '@/models/FacebookPost';

/**
 * GET /api/admin/facebook-automation/posts
 * ดึงรายการโพสต์ทั้งหมด
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const query: any = {};

    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }

    const total = await FacebookPost.countDocuments(query);
    const posts = await FacebookPost.find(query)
      .sort({ createdTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/facebook-automation/posts
 * สร้างหรืออัพเดทโพสต์
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      postId,
      message,
      postType,
      attachments,
      permalink,
      createdTime,
      automation,
    } = body;

    // ตรวจสอบว่ามีโพสต์นี้อยู่แล้วหรือไม่
    const existingPost = await FacebookPost.findOne({ postId });

    if (existingPost) {
      // อัพเดท
      await FacebookPost.updateOne(
        { postId },
        {
          $set: {
            message,
            postType,
            attachments,
            permalink,
            createdTime,
            automation,
          },
        }
      );

      const updatedPost = await FacebookPost.findOne({ postId });

      return NextResponse.json({
        success: true,
        data: updatedPost,
        message: 'Post updated successfully',
      });
    } else {
      // สร้างใหม่
      const newPost = await FacebookPost.create({
        postId,
        message,
        postType: postType || 'status',
        attachments,
        permalink,
        createdTime: createdTime || new Date(),
        automation: automation || {
          enabled: false,
          commentReply: { enabled: false },
          privateMessage: { enabled: false },
        },
        stats: {
          commentsCount: 0,
          messagesCount: 0,
        },
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        data: newPost,
        message: 'Post created successfully',
      });
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

