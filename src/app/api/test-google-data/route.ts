import { NextRequest, NextResponse } from 'next/server';
import { getGoogleExtraData, refreshGoogleDataCache } from '@/utils/openai-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get('refresh') === 'true';
    
    if (refresh) {
      await refreshGoogleDataCache();
    }
    
    const data = await getGoogleExtraData('Basic');
    
    return NextResponse.json({
      success: true,
      data: {
        googleDocInstructions: data.googleDocInstructions ? 'มีข้อมูล' : 'ไม่มีข้อมูล',
        googleDocLength: data.googleDocInstructions?.length || 0,
        sheetsCount: data.sheets.length,
        sheets: data.sheets.map((sheet: any) => ({
          name: sheet.sheetName,
          rowCount: sheet.data.length
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[test-google-data] error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
