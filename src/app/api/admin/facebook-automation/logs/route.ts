import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookAutomationLog from '@/models/FacebookAutomationLog';

/**
 * GET /api/admin/facebook-automation/logs
 * ดึงรายการ logs
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};

    if (postId) {
      query.postId = postId;
    }

    if (action) {
      query.action = action;
    }

    if (status) {
      query.status = status;
    }

    const total = await FacebookAutomationLog.countDocuments(query);
    const logs = await FacebookAutomationLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

