/**
 * ฟังก์ชันสำหรับจัดการเบอร์โทรศัพท์
 */

/**
 * ตรวจสอบว่าเบอร์โทรศัพท์ถูกต้องหรือไม่
 * @param phone เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
 * @returns true หากเบอร์โทรศัพท์ถูกต้อง
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // ลบช่องว่างและเครื่องหมายพิเศษ
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // ตรวจสอบรูปแบบเบอร์โทรศัพท์ไทย
  // รองรับ: 0xxxxxxxxx, 66xxxxxxxxx, +66xxxxxxxxx
  const thaiPhoneRegex = /^(0|66|\+66)?[689]\d{8}$/;
  
  return thaiPhoneRegex.test(cleanPhone);
}

/**
 * แปลงเบอร์โทรศัพท์เป็นรูปแบบมาตรฐาน (66xxxxxxxxx)
 * @param phone เบอร์โทรศัพท์ที่ต้องการแปลง
 * @returns เบอร์โทรศัพท์ในรูปแบบมาตรฐาน
 * @throws Error หากเบอร์โทรศัพท์ไม่ถูกต้อง
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('เบอร์โทรศัพท์ไม่สามารถเป็นค่าว่างได้');
  }
  
  // ลบช่องว่างและเครื่องหมายพิเศษ
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // ตรวจสอบว่าเบอร์โทรศัพท์ถูกต้องหรือไม่
  if (!isValidPhoneNumber(cleanPhone)) {
    throw new Error('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
  }
  
  // แปลงเป็นรูปแบบมาตรฐาน
  if (cleanPhone.startsWith('0')) {
    // เปลี่ยนจาก 0xxxxxxxxx เป็น 66xxxxxxxxx
    cleanPhone = '66' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('+66')) {
    // เปลี่ยนจาก +66xxxxxxxxx เป็น 66xxxxxxxxx
    cleanPhone = cleanPhone.substring(1);
  }
  
  // ตรวจสอบว่าต้องขึ้นต้นด้วย 66 และตามด้วย 9 หลัก
  if (!cleanPhone.startsWith('66') || cleanPhone.length !== 11) {
    throw new Error('ความยาวเบอร์โทรศัพท์ไม่ถูกต้อง');
  }
  
  return cleanPhone;
}

/**
 * แปลงเบอร์โทรศัพท์เป็นรูปแบบที่แสดงผล (0xxxxxxxxx)
 * @param phone เบอร์โทรศัพท์ในรูปแบบมาตรฐาน (66xxxxxxxxx)
 * @returns เบอร์โทรศัพท์ในรูปแบบที่แสดงผล
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  
  // ลบช่องว่างและเครื่องหมายพิเศษ
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // ตรวจสอบว่าเป็นรูปแบบมาตรฐานหรือไม่
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    return '0' + cleanPhone.substring(2);
  }
  
  return cleanPhone;
}

/**
 * ตรวจสอบว่าเบอร์โทรศัพท์เป็นเบอร์มือถือหรือไม่
 * @param phone เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
 * @returns true หากเป็นเบอร์มือถือ
 */
export function isMobileNumber(phone: string): boolean {
  if (!phone) return false;
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // เบอร์มือถือไทยขึ้นต้นด้วย 6, 8, 9
  if (cleanPhone.startsWith('66')) {
    const secondDigit = cleanPhone.charAt(2);
    return ['6', '8', '9'].includes(secondDigit);
  } else if (cleanPhone.startsWith('0')) {
    const secondDigit = cleanPhone.charAt(1);
    return ['6', '8', '9'].includes(secondDigit);
  }
  
  return false;
}

/**
 * ตรวจสอบว่าเบอร์โทรศัพท์เป็นเบอร์บ้านหรือไม่
 * @param phone เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
 * @returns true หากเป็นเบอร์บ้าน
 */
export function isLandlineNumber(phone: string): boolean {
  if (!phone) return false;
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // เบอร์บ้านไทยขึ้นต้นด้วย 2, 3, 4, 5, 7
  if (cleanPhone.startsWith('66')) {
    const secondDigit = cleanPhone.charAt(2);
    return ['2', '3', '4', '5', '7'].includes(secondDigit);
  } else if (cleanPhone.startsWith('0')) {
    const secondDigit = cleanPhone.charAt(1);
    return ['2', '3', '4', '5', '7'].includes(secondDigit);
  }
  
  return false;
}

/**
 * แสดงเบอร์โทรศัพท์ในรูปแบบที่อ่านง่าย
 * @param phone เบอร์โทรศัพท์ที่ต้องการจัดรูปแบบ
 * @returns เบอร์โทรศัพท์ในรูปแบบที่อ่านง่าย
 */
export function formatReadablePhone(phone: string): string {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    // แปลง 66xxxxxxxxx เป็น 0xx-xxx-xxxx
    const displayPhone = '0' + cleanPhone.substring(2);
    return `${displayPhone.substring(0, 3)}-${displayPhone.substring(3, 6)}-${displayPhone.substring(6)}`;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    // แปลง 0xxxxxxxxx เป็น 0xx-xxx-xxxx
    return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`;
  }
  
  return cleanPhone;
}
