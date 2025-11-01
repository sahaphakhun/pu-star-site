import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookComment from '@/models/FacebookComment';

/**
 * GET /api/admin/facebook-automation/comments
 * ดึงรายการคอมเมนต์
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};

    if (postId) {
      query.postId = postId;
    }

    const total = await FacebookComment.countDocuments(query);
    const comments = await FacebookComment.find(query)
      .sort({ createdTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

