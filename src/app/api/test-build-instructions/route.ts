import { NextRequest, NextResponse } from 'next/server';
import { buildSystemInstructions, refreshGoogleDataCache } from '@/utils/openai-utils';

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';
    if (refresh) {
      await refreshGoogleDataCache();
    }
    const instructions = await buildSystemInstructions('Basic');
    return NextResponse.json({ success: true, instructions });
  } catch (error: any) {
    console.error('[test-build-instructions] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
