import React from "react";

export default function ContactInfoPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      {/* หัวข้อหน้า */}
      <section className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">ข้อมูลติดต่อ</h1>
        <p className="text-gray-600 mt-2">รายละเอียดช่องทางการติดต่อ WINRICH DYNAMIC ประเทศไทย</p>
      </section>

      {/* สำนักงานใหญ่ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4">สำนักงานใหญ่ (ประเทศไทย)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-primary mb-2">ที่อยู่</h3>
            <p className="text-gray-700">บริษัท พูสตาร์ (ประเทศไทย) จำกัด</p>
            <p className="text-gray-700">123/456 อาคารพูสตาร์ ชั้น 15</p>
            <p className="text-gray-700">ถนนสุขุมวิท แขวงคลองเตย</p>
            <p className="text-gray-700">เขตคลองเตย กรุงเทพฯ 10110</p>
            
            <h3 className="font-bold text-primary mt-4 mb-2">ข้อมูลทั่วไป</h3>
            <p className="text-gray-700">โทรศัพท์: 02-123-4567</p>
            <p className="text-gray-700">แฟกซ์: 02-123-4570</p>
            <p className="text-gray-700">อีเมล: info@pustar-thailand.com</p>
            <p className="text-gray-700">เวลาทำการ: จันทร์ - ศุกร์ 8:30 - 17:30 น., เสาร์ 9:00 - 13:00 น.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-primary mb-2">การเดินทาง</h3>
            <p className="text-gray-700"><span className="font-medium">รถไฟฟ้า BTS:</span> สถานีอโศก ทางออก 3 เดินต่อประมาณ 300 เมตร</p>
            <p className="text-gray-700"><span className="font-medium">รถไฟฟ้า MRT:</span> สถานีสุขุมวิท ทางออก 2 เดินต่อประมาณ 400 เมตร</p>
            <p className="text-gray-700"><span className="font-medium">รถประจำทาง:</span> สาย 2, 25, 38, 40, 98, 501, 508</p>
            
            <h3 className="font-bold text-primary mt-4 mb-2">จุดสังเกต</h3>
            <p className="text-gray-700">- อยู่ตรงข้ามโรงแรมเอ็มโพเรียม สวีท</p>
            <p className="text-gray-700">- ใกล้กับห้างสรรพสินค้าเทอมินอล 21</p>
            <p className="text-gray-700">- มีป้ายบริษัท PU STAR ขนาดใหญ่ด้านหน้าอาคาร</p>
          </div>
        </div>
      </section>

      {/* แผนกต่างๆ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">แผนกต่างๆ</h2>
        
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฝ่ายขายและการตลาด</h3>
            <p className="text-gray-700">สำหรับข้อมูลสินค้า การสั่งซื้อ และความต้องการพิเศษ</p>
            <p className="text-gray-700 mt-1">ติดต่อ: คุณสมหมาย รักการขาย (ผู้จัดการฝ่ายขาย)</p>
            <p className="text-gray-700">โทรศัพท์: 02-123-4568 ต่อ 101-105</p>
            <p className="text-gray-700">อีเมล: sales@pustar-thailand.com</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฝ่ายเทคนิคและบริการลูกค้า</h3>
            <p className="text-gray-700">สำหรับคำแนะนำทางเทคนิค การใช้งานผลิตภัณฑ์ และความช่วยเหลือ</p>
            <p className="text-gray-700 mt-1">ติดต่อ: คุณสมศรี เชี่ยวชาญ (ผู้จัดการฝ่ายเทคนิค)</p>
            <p className="text-gray-700">โทรศัพท์: 02-123-4569 ต่อ 201-205</p>
            <p className="text-gray-700">อีเมล: support@pustar-thailand.com</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฝ่ายบัญชีและการเงิน</h3>
            <p className="text-gray-700">สำหรับข้อมูลการชำระเงิน ใบแจ้งหนี้ และการเงิน</p>
            <p className="text-gray-700 mt-1">ติดต่อ: คุณสมพร บัญชีดี (ผู้จัดการฝ่ายบัญชี)</p>
            <p className="text-gray-700">โทรศัพท์: 02-123-4571 ต่อ 301-305</p>
            <p className="text-gray-700">อีเมล: finance@pustar-thailand.com</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฝ่ายโลจิสติกส์และจัดส่ง</h3>
            <p className="text-gray-700">สำหรับข้อมูลการจัดส่งสินค้าและติดตามพัสดุ</p>
            <p className="text-gray-700 mt-1">ติดต่อ: คุณสมชาย ส่งไว (ผู้จัดการฝ่ายโลจิสติกส์)</p>
            <p className="text-gray-700">โทรศัพท์: 02-123-4572 ต่อ 401-405</p>
            <p className="text-gray-700">อีเมล: logistics@pustar-thailand.com</p>
          </div>
          
          <div>
            <h3 className="font-bold text-primary mb-2">ฝ่ายทรัพยากรบุคคล</h3>
            <p className="text-gray-700">สำหรับข้อมูลการสมัครงานและโอกาสทางอาชีพ</p>
            <p className="text-gray-700 mt-1">ติดต่อ: คุณสมใจ คนเก่ง (ผู้จัดการฝ่ายทรัพยากรบุคคล)</p>
            <p className="text-gray-700">โทรศัพท์: 02-123-4573 ต่อ 501-505</p>
            <p className="text-gray-700">อีเมล: hr@pustar-thailand.com</p>
          </div>
        </div>
      </section>

      {/* ช่องทางติดต่อออนไลน์ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ช่องทางติดต่อออนไลน์</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="font-bold text-primary mb-2">เว็บไซต์</h3>
            <a href="https://www.pustar-thailand.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.pustar-thailand.com</a>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
            </div>
            <h3 className="font-bold text-primary mb-2">Facebook</h3>
            <a href="https://www.facebook.com/PuStarThailand" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@PuStarThailand</a>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
            </div>
            <h3 className="font-bold text-primary mb-2">Instagram</h3>
            <a href="https://www.instagram.com/pustar_thailand" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@pustar_thailand</a>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.4 1.26 4.5 2.44.8 1.09 1.6 2.97 1.5 6.7-.06 1.92-.6 3.07-1.28 3.77-.69.69-1.83 1.73-3.72 1.73-.69 0-1.2-.11-1.85-.3-.65-.19-1.28-.51-1.66-.93-.38-.42-.8-.92-.91-1.73-.11-.84-.14-1.57 0-2.44.13-.86.32-1.27.58-1.76h-1.97c-.04.57-.28 1.33-.56 1.95-.3.65-.85 1.35-1.76 1.83-.8.46-2.31.93-4.3.93l.2 1.89c.06.5.4.86.79.86.14 0 .27-.04.39-.12l1.9-1.25c.5-.35 1.19-.35 1.68 0l1.82 1.23c.12.08.25.12.39.12.39 0 .74-.36.79-.86l.2-1.89c-1.95 0-3.48-.45-4.29-.93-.8-.47-1.37-1.16-1.68-1.8-.31-.64-.55-1.38-.6-1.96h-1.97c.26.49.45.9.58 1.76.14.87.11 1.58 0 2.39-.11.81-.54 1.34-.92 1.77-.38.42-1.03.74-1.69.93-.66.19-1.18.3-1.89.3-1.92 0-3.09-1.04-3.8-1.73-.71-.69-1.28-1.83-1.35-3.76-.11-3.75.69-5.64 1.5-6.74 1.11-1.17 2.79-1.96 4.5-2.43l.28-2.34h-4.97v-4.05h-1.96v4.05h-5l1.65 16.47c.09.85.77 1.46 1.62 1.46h1.67c.85 0 1.54-.64 1.64-1.46l.11-1.17c.04-.39.38-.67.76-.63.32.03.57.28.62.59l.33 2.19c.11.82.78 1.47 1.62 1.47h1.59c.84 0 1.53-.65 1.63-1.47l.35-2.22c.04-.32.29-.58.63-.59.38 0 .72.28.76.67l.11 1.14c.1.82.78 1.46 1.63 1.46z" />
              </svg>
            </div>
            <h3 className="font-bold text-primary mb-2">Line Official</h3>
            <a href="https://line.me/ti/p/@pustar-thailand" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@pustar-thailand</a>
          </div>
        </div>
      </section>

      {/* ตัวแทนจำหน่าย */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center">
          ตัวแทนจำหน่ายทั่วประเทศ
          <span className="ml-2 text-sm font-normal text-white bg-accent py-1 px-2 rounded-full">10 สาขา</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-primary mb-3">ภาคกลาง</h3>
            <ul className="space-y-4">
              <li>
                <p className="font-medium">พูสตาร์ กรุงเทพฯ (สำนักงานใหญ่)</p>
                <p className="text-gray-700 text-sm">123/456 อาคารพูสตาร์ ชั้น 15, กรุงเทพฯ</p>
                <p className="text-gray-700 text-sm">โทร: 02-123-4567</p>
              </li>
              <li>
                <p className="font-medium">พูสตาร์ นนทบุรี</p>
                <p className="text-gray-700 text-sm">88/99 หมู่ 5 ถ.รัตนาธิเบศร์, บางกระสอ, นนทบุรี</p>
                <p className="text-gray-700 text-sm">โทร: 02-123-5555</p>
              </li>
              <li>
                <p className="font-medium">พูสตาร์ สมุทรปราการ</p>
                <p className="text-gray-700 text-sm">555/6 หมู่ 3 ถ.สุขุมวิท, บางปู, สมุทรปราการ</p>
                <p className="text-gray-700 text-sm">โทร: 02-123-6666</p>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-primary mb-3">ภาคเหนือ</h3>
            <ul className="space-y-4">
              <li>
                <p className="font-medium">พูสตาร์ เชียงใหม่</p>
                <p className="text-gray-700 text-sm">123 ถ.ห้วยแก้ว, สุเทพ, เมือง, เชียงใหม่</p>
                <p className="text-gray-700 text-sm">โทร: 053-123-456</p>
              </li>
              <li>
                <p className="font-medium">พูสตาร์ เชียงราย</p>
                <p className="text-gray-700 text-sm">99 หมู่ 2 ถ.พหลโยธิน, เวียง, เมือง, เชียงราย</p>
                <p className="text-gray-700 text-sm">โทร: 053-456-789</p>
              </li>
            </ul>
            
            <h3 className="font-bold text-primary mt-6 mb-3">ภาคตะวันออก</h3>
            <ul className="space-y-4">
              <li>
                <p className="font-medium">พูสตาร์ ชลบุรี</p>
                <p className="text-gray-700 text-sm">789/1 ถ.สุขุมวิท, บางปลาสร้อย, เมือง, ชลบุรี</p>
                <p className="text-gray-700 text-sm">โทร: 038-123-456</p>
              </li>
            </ul>
          </div>
        </div>
        
        <h3 className="font-bold text-primary mt-6 mb-3">ภาคตะวันออกเฉียงเหนือ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ul className="space-y-4">
            <li>
              <p className="font-medium">พูสตาร์ ขอนแก่น</p>
              <p className="text-gray-700 text-sm">456 ถ.มิตรภาพ, ในเมือง, เมือง, ขอนแก่น</p>
              <p className="text-gray-700 text-sm">โทร: 043-123-456</p>
            </li>
            <li>
              <p className="font-medium">พูสตาร์ อุดรธานี</p>
              <p className="text-gray-700 text-sm">789 ถ.ทหาร, หมากแข้ง, เมือง, อุดรธานี</p>
              <p className="text-gray-700 text-sm">โทร: 042-123-456</p>
            </li>
          </ul>
          
          <div>
            <h3 className="font-bold text-primary mb-3 md:hidden">ภาคใต้</h3>
            <ul className="space-y-4">
              <li>
                <p className="font-medium">พูสตาร์ ภูเก็ต</p>
                <p className="text-gray-700 text-sm">123/45 ถ.ภูเก็ต, ตลาดเหนือ, เมือง, ภูเก็ต</p>
                <p className="text-gray-700 text-sm">โทร: 076-123-456</p>
              </li>
              <li>
                <p className="font-medium">พูสตาร์ หาดใหญ่</p>
                <p className="text-gray-700 text-sm">456/78 ถ.เพชรเกษม, หาดใหญ่, สงขลา</p>
                <p className="text-gray-700 text-sm">โทร: 074-123-456</p>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/contact/distributors" className="text-accent hover:underline font-medium">ดูรายชื่อตัวแทนจำหน่ายทั้งหมด</a>
        </div>
      </section>
    </div>
  );
} 