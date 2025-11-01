import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookPost from '@/models/FacebookPost';
import FacebookComment from '@/models/FacebookComment';
import FacebookAutomationLog from '@/models/FacebookAutomationLog';

/**
 * GET /api/admin/facebook-automation/stats
 * ดึงสถิติรวม
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    const query: any = {};
    if (postId) {
      query.postId = postId;
    }

    // สถิติรวม
    const totalPosts = await FacebookPost.countDocuments(
      postId ? { postId } : {}
    );
    const activePosts = await FacebookPost.countDocuments({
      ...(postId ? { postId } : {}),
      'automation.enabled': true,
    });
    const totalComments = await FacebookComment.countDocuments(query);
    const repliedComments = await FacebookComment.countDocuments({
      ...query,
      'automation.commentReplied': true,
    });
    const sentMessages = await FacebookComment.countDocuments({
      ...query,
      'automation.privateMessageSent': true,
    });

    // Logs สถิติ
    const successLogs = await FacebookAutomationLog.countDocuments({
      ...query,
      status: 'success',
    });
    const failedLogs = await FacebookAutomationLog.countDocuments({
      ...query,
      status: 'failed',
    });

    // สถิติย้อนหลัง 7 วัน
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComments = await FacebookComment.countDocuments({
      ...query,
      createdTime: { $gte: sevenDaysAgo },
    });

    const recentMessages = await FacebookComment.countDocuments({
      ...query,
      'automation.privateMessageSent': true,
      'automation.privateMessageSentAt': { $gte: sevenDaysAgo },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPosts,
          activePosts,
          totalComments,
          repliedComments,
          sentMessages,
        },
        logs: {
          success: successLogs,
          failed: failedLogs,
          total: successLogs + failedLogs,
        },
        recent: {
          comments: recentComments,
          messages: recentMessages,
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

