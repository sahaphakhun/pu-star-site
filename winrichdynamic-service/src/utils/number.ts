// เครื่องมือช่วยจัดการจำนวนเงินและทศนิยมให้เสถียร ลดปัญหา 19.9999

/** คูณด้วย 100 และปัดให้เป็นจำนวนเต็ม เพื่อลด floating error */
export function toCents(amount: number): number {
  if (!isFinite(amount) || isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

/** แปลง cents กลับเป็นจำนวนเงินแบบทศนิยม 2 ตำแหน่ง */
export function fromCents(cents: number): number {
  if (!isFinite(cents) || isNaN(cents)) return 0;
  return cents / 100;
}

/** บวกเลขเงินแบบเสถียร (หน่วยบาท) แล้วคืนค่าเป็นบาททศนิยม 2 ตำแหน่ง */
export function addMoney(...values: number[]): number {
  const totalCents = values.reduce((sum, v) => sum + toCents(v || 0), 0);
  return fromCents(totalCents);
}

/** ลบเลขเงินแบบเสถียร (หน่วยบาท) แล้วคืนค่าเป็นบาททศนิยม 2 ตำแหน่ง */
export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a || 0) - toCents(b || 0));
}

/** คูณเลขเงินกับจำนวนแบบเสถียร (เช่น qty*unitPrice) คืนค่าเป็นบาท 2 ตำแหน่ง */
export function multiplyMoney(amount: number, multiplier: number): number {
  // แปลงเป็น cents ก่อนคูณ เพื่อลดความคลาดเคลื่อน
  const cents = toCents(amount || 0);
  const resultCents = Math.round(cents * (multiplier || 0));
  return fromCents(resultCents);
}

/** ปัดทศนิยมเป็น 2 ตำแหน่งแบบคงที่ */
export function round2(n: number): number {
  return fromCents(toCents(n || 0));
}

/** คำนวณ VAT แบบภาษีรวมในราคา: แยก vatAmount ออกจาก totalAmount รวมภาษีแล้ว */
export function computeVatIncluded(totalAmount: number, vatRatePercent: number): { vatAmount: number; netOfVat: number } {
  const rate = (vatRatePercent || 0) / 100;
  if (rate <= 0) return { vatAmount: 0, netOfVat: round2(totalAmount || 0) };
  const total = round2(totalAmount || 0);
  // vat = total * (r / (1+r))
  const vat = round2(total * (rate / (1 + rate)));
  const net = subtractMoney(total, vat);
  return { vatAmount: vat, netOfVat: net };
}

/** คำนวณราคารวมต่อรายการ = qty * unitPrice * (1 - discount%) แบบเสถียร */
export function computeLineTotal(quantity: number, unitPrice: number, discountPercent: number): number {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const discount = Number(discountPercent) || 0;
  const gross = multiplyMoney(price, qty);
  const discountAmount = multiplyMoney(gross, discount / 100);
  return subtractMoney(gross, discountAmount);
}


