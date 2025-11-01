import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookPost from '@/models/FacebookPost';

/**
 * GET /api/admin/facebook-automation/posts/[postId]
 * ดึงข้อมูลโพสต์
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await dbConnect();

    const post = await FacebookPost.findOne({ postId: params.postId });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('[API] Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/facebook-automation/posts/[postId]
 * อัพเดทการตั้งค่า automation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { automation } = body;

    const post = await FacebookPost.findOne({ postId: params.postId });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // อัพเดท automation settings
    await FacebookPost.updateOne(
      { postId: params.postId },
      {
        $set: { automation },
      }
    );

    const updatedPost = await FacebookPost.findOne({ postId: params.postId });

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Automation settings updated successfully',
    });
  } catch (error: any) {
    console.error('[API] Error updating post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/facebook-automation/posts/[postId]
 * ลบโพสต์
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await dbConnect();

    const post = await FacebookPost.findOne({ postId: params.postId });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    await FacebookPost.deleteOne({ postId: params.postId });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('[API] Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

