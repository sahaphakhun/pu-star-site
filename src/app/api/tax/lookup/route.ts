import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taxId = searchParams.get('taxId');

    if (!taxId) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุเลขประจำตัวผู้เสียภาษี'
      }, { status: 400 });
    }

    // ตรวจสอบรูปแบบเลขประจำตัวผู้เสียภาษี (13 หลัก)
    if (!/^\d{13}$/.test(taxId)) {
      return NextResponse.json({
        success: false,
        message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'
      }, { status: 400 });
    }

    // เรียก API ของกรมพัฒนาธุรกิจการค้า
    const mocApiUrl = `https://data.moc.go.th/OpenData/Juristic?$filter=juristic_id eq '${taxId}'&$format=json`;
    
    const response = await fetch(mocApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TaxLookupBot/1.0)'
      },
      // ตั้งค่า timeout 10 วินาที
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }

    const data = await response.json();
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!data.value || data.value.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัทที่มีเลขประจำตัวผู้เสียภาษีนี้'
      }, { status: 404 });
    }

    const companyData = data.value[0];
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const result = {
      success: true,
      data: {
        companyName: companyData.juristic_name_th || companyData.juristic_name_en || '',
        taxId: companyData.juristic_id || taxId,
        companyAddress: formatAddress(companyData),
        companyPhone: companyData.telephone || '',
        companyEmail: '', // API ไม่มีข้อมูลอีเมล ต้องให้ผู้ใช้กรอกเอง
        registrationDate: companyData.registration_date || '',
        status: companyData.juristic_status || '',
        businessType: companyData.business_type || ''
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Tax lookup error:', error);
    
    // จัดการ error ต่างๆ
    if (error.name === 'TimeoutError') {
      return NextResponse.json({
        success: false,
        message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง'
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับจัดรูปแบบที่อยู่
function formatAddress(companyData: any): string {
  const addressParts = [];
  
  if (companyData.address_no) addressParts.push(companyData.address_no);
  if (companyData.building) addressParts.push(`อาคาร ${companyData.building}`);
  if (companyData.floor) addressParts.push(`ชั้น ${companyData.floor}`);
  if (companyData.room) addressParts.push(`ห้อง ${companyData.room}`);
  if (companyData.village) addressParts.push(`หมู่บ้าน ${companyData.village}`);
  if (companyData.lane) addressParts.push(`ตรอก/ซอย ${companyData.lane}`);
  if (companyData.road) addressParts.push(`ถนน ${companyData.road}`);
  if (companyData.sub_district) addressParts.push(`ตำบล/แขวง ${companyData.sub_district}`);
  if (companyData.district) addressParts.push(`อำเภอ/เขต ${companyData.district}`);
  if (companyData.province) addressParts.push(`จังหวัด ${companyData.province}`);
  if (companyData.postal_code) addressParts.push(companyData.postal_code);

  return addressParts.join(' ');
}