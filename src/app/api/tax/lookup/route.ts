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

    // เรียก API ของกรมพัฒนาธุรกิจการค้า (ใช้ endpoint ใหม่ตามเอกสาร)
    const mocApiUrl = `https://dataapi.moc.go.th/juristic?juristic_id=${taxId}`;
    
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
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่ (API ใหม่คืนค่าเป็น object ตรงๆ)
    if (!data || !data.juristicID) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัทที่มีเลขประจำตัวผู้เสียภาษีนี้'
      }, { status: 404 });
    }

    const companyData = data;
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม (ใช้ field names ตามเอกสาร MOC)
    const result = {
      success: true,
      data: {
        companyName: companyData.juristicNameTH || companyData.juristicNameEN || '',
        taxId: companyData.juristicID || taxId,
        companyAddress: formatAddress(companyData.addressDetail),
        companyPhone: '', // API ไม่มีข้อมูลเบอร์โทร
        companyEmail: '', // API ไม่มีข้อมูลอีเมล ต้องให้ผู้ใช้กรอกเอง
        registrationDate: companyData.registerDate || '',
        status: companyData.juristicStatus || '',
        businessType: companyData.juristicType || ''
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

// ฟังก์ชันสำหรับจัดรูปแบบที่อยู่ (ใช้ field names ตามเอกสาร MOC)
function formatAddress(addressDetail: any): string {
  if (!addressDetail) return '';
  
  const addressParts = [];
  
  if (addressDetail.houseNumber) addressParts.push(addressDetail.houseNumber);
  if (addressDetail.buildingName) addressParts.push(`อาคาร ${addressDetail.buildingName}`);
  if (addressDetail.floor) addressParts.push(`ชั้น ${addressDetail.floor}`);
  if (addressDetail.roomNo) addressParts.push(`ห้อง ${addressDetail.roomNo}`);
  if (addressDetail.villageName) addressParts.push(`หมู่บ้าน ${addressDetail.villageName}`);
  if (addressDetail.moo) addressParts.push(`หมู่ ${addressDetail.moo}`);
  if (addressDetail.soi) addressParts.push(`ซอย ${addressDetail.soi}`);
  if (addressDetail.street) addressParts.push(`ถนน ${addressDetail.street}`);
  if (addressDetail.subDistrict) addressParts.push(`ตำบล/แขวง ${addressDetail.subDistrict}`);
  if (addressDetail.district) addressParts.push(`อำเภอ/เขต ${addressDetail.district}`);
  if (addressDetail.province) addressParts.push(`จังหวัด ${addressDetail.province}`);

  return addressParts.join(' ');
}