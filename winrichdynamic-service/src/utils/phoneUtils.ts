/**
 * ฟังก์ชันสำหรับจัดการเบอร์โทรศัพท์
 */

/**
 * แปลงเบอร์โทรศัพท์ให้เป็นรูปแบบมาตรฐาน (66xxxxxxxxx)
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการแปลง
 * @returns เบอร์โทรศัพท์ในรูปแบบมาตรฐาน
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // ลบอักขระที่ไม่ใช่ตัวเลข
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // ตรวจสอบความยาว
  if (cleanPhone.length < 9 || cleanPhone.length > 10) {
    throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอก 9-10 หลัก');
  }

  // แปลงเบอร์โทรศัพท์
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    // แปลงจาก 08xxxxxxxx เป็น 668xxxxxxxx
    return '66' + cleanPhone.substring(1);
  } else if (cleanPhone.length === 9) {
    // เบอร์ 9 หลัก เช่น 995429353
    return '66' + cleanPhone;
  } else if (cleanPhone.startsWith('66')) {
    // เป็นรูปแบบที่ถูกต้องแล้ว
    return cleanPhone;
  }

  // กรณีอื่นๆ
  return cleanPhone;
}

/**
 * ตรวจสอบว่าเบอร์โทรศัพท์ถูกต้องหรือไม่
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
 * @returns true ถ้าเบอร์โทรศัพท์ถูกต้อง
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length >= 9 && cleanPhone.length <= 10;
  } catch {
    return false;
  }
}

/**
 * แปลงเบอร์โทรศัพท์จากรูปแบบมาตรฐานกลับเป็นรูปแบบไทย (0xxxxxxxxx)
 * @param phoneNumber เบอร์โทรศัพท์ในรูปแบบมาตรฐาน
 * @returns เบอร์โทรศัพท์ในรูปแบบไทย
 */
export function formatPhoneNumberToThai(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    // แปลงจาก 668xxxxxxxx เป็น 08xxxxxxxx
    return '0' + cleanPhone.substring(2);
  }
  
  return cleanPhone;
}

/**
 * แสดงเบอร์โทรศัพท์ในรูปแบบที่อ่านง่าย
 * @param phoneNumber เบอร์โทรศัพท์
 * @returns เบอร์โทรศัพท์ในรูปแบบที่อ่านง่าย
 */
export function displayPhoneNumber(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    // แสดงเป็น 0xx-xxx-xxxx
    const thaiPhone = '0' + cleanPhone.substring(2);
    return thaiPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (cleanPhone.length === 10) {
    // แสดงเป็น 0xx-xxx-xxxx
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (cleanPhone.length === 9) {
    // แสดงเป็น xxx-xxx-xxx
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  }
  
  return phoneNumber;
}
