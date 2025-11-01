import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineNotificationGroup from '@/models/LineNotificationGroup';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const groups = await LineNotificationGroup.find({}).lean();
    
    return NextResponse.json({
      success: true,
      totalGroups: groups.length,
      enabledGroups: groups.filter(g => g.enabled).length,
      groups: groups.map(g => ({
        groupId: g.groupId,
        sourceType: g.sourceType,
        enabled: g.enabled,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      })),
      config: {
        hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        hasChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
        accessTokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0
      }
    });
  } catch (error) {
    console.error('[LINE Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
