import React from "react";

export default function CareersPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      {/* หัวข้อหน้า */}
      <section className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">ร่วมงานกับเรา</h1>
        <p className="text-gray-600 mt-2">
          เติบโตไปด้วยกันกับ PU STAR ผู้นำด้านผลิตภัณฑ์ซีลแลนท์และกาว
        </p>
      </section>

      {/* ข้อความต้อนรับ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4">เติบโตไปด้วยกันกับเรา</h2>
        <p className="text-gray-700 mb-3">
          บริษัท พูสตาร์ (ประเทศไทย) จำกัด เป็นส่วนหนึ่งของ Guangdong Pustar Adhesives & Sealants Co. Ltd. องค์กรไฮเทคระดับโลกที่มีความเชี่ยวชาญด้านการวิจัยและพัฒนานวัตกรรมซีลแลนท์และกาว
        </p>
        <p className="text-gray-700 mb-3">
          เรากำลังมองหาบุคลากรที่มีความสามารถและมีใจรักในการพัฒนา มาร่วมเป็นส่วนหนึ่งของทีมที่มุ่งมั่นสร้างสรรค์ผลิตภัณฑ์คุณภาพสูงเพื่อตอบสนองความต้องการของลูกค้าทั่วโลก
        </p>
        <p className="text-gray-700">
          หากคุณกำลังมองหาโอกาสในการเติบโตทางอาชีพ ในสภาพแวดล้อมการทำงานที่ส่งเสริมนวัตกรรมและความคิดสร้างสรรค์ PU STAR คือคำตอบสำหรับคุณ
        </p>
      </section>

      {/* สวัสดิการ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ทำไมต้องร่วมงานกับ PU STAR</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary/5 p-4 rounded-md flex">
            <div className="mr-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">สวัสดิการครอบคลุม</h3>
              <p className="text-sm text-gray-700">ประกันสุขภาพ, กองทุนสำรองเลี้ยงชีพ, โบนัสประจำปี, เงินช่วยเหลือต่างๆ</p>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md flex">
            <div className="mr-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">โอกาสเติบโตในสายอาชีพ</h3>
              <p className="text-sm text-gray-700">แผนพัฒนาสายอาชีพ, โอกาสเลื่อนตำแหน่ง, ทำงานข้ามสายงาน</p>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md flex">
            <div className="mr-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">การฝึกอบรมและพัฒนา</h3>
              <p className="text-sm text-gray-700">โปรแกรมฝึกอบรมทั้งในและต่างประเทศ, ทุนการศึกษาต่อ</p>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md flex">
            <div className="mr-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">โอกาสทำงานในต่างประเทศ</h3>
              <p className="text-sm text-gray-700">โอกาสทำงานในบริษัทเครือข่ายทั่วโลก, การแลกเปลี่ยนความรู้</p>
            </div>
          </div>
        </div>
      </section>

      {/* ตำแหน่งงานที่เปิดรับ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ตำแหน่งงานที่เปิดรับสมัคร</h2>
        
        <div className="space-y-6">
          {/* ตำแหน่ง 1 */}
          <div className="border border-primary/20 rounded-md overflow-hidden">
            <div className="bg-primary/10 p-4">
              <h3 className="font-bold text-primary text-lg">วิศวกรเคมี (Chemical Engineer)</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">เต็มเวลา</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">แผนกวิจัยและพัฒนา</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">กรุงเทพฯ</span>
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium text-primary mb-1">คุณสมบัติ:</h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  <li>จบการศึกษาระดับปริญญาตรีขึ้นไป สาขาวิศวกรรมเคมี หรือสาขาที่เกี่ยวข้อง</li>
                  <li>มีประสบการณ์ด้านการพัฒนาผลิตภัณฑ์ซีลแลนท์หรือกาว 2 ปีขึ้นไป</li>
                  <li>มีความรู้ด้าน Polymer Chemistry และกระบวนการผลิต</li>
                  <li>สามารถใช้ภาษาอังกฤษในการสื่อสารได้ดี</li>
                </ul>
              </div>
              
              <div className="text-right">
                <a 
                  href="/contact/careers/chemical-engineer" 
                  className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  ดูรายละเอียดและสมัคร
                </a>
              </div>
            </div>
          </div>
          
          {/* ตำแหน่ง 2 */}
          <div className="border border-primary/20 rounded-md overflow-hidden">
            <div className="bg-primary/10 p-4">
              <h3 className="font-bold text-primary text-lg">ผู้จัดการฝ่ายขาย (Sales Manager)</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">เต็มเวลา</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">แผนกขาย</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">กรุงเทพฯ</span>
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium text-primary mb-1">คุณสมบัติ:</h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  <li>จบการศึกษาระดับปริญญาตรีขึ้นไป</li>
                  <li>มีประสบการณ์ด้านการขายในอุตสาหกรรมวัสดุก่อสร้าง 5 ปีขึ้นไป</li>
                  <li>มีทักษะการบริหารทีมขาย และสร้างความสัมพันธ์กับลูกค้า</li>
                  <li>สามารถใช้ภาษาอังกฤษในการสื่อสารได้ดี</li>
                </ul>
              </div>
              
              <div className="text-right">
                <a 
                  href="/contact/careers/sales-manager" 
                  className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  ดูรายละเอียดและสมัคร
                </a>
              </div>
            </div>
          </div>
          
          {/* ตำแหน่ง 3 */}
          <div className="border border-primary/20 rounded-md overflow-hidden">
            <div className="bg-primary/10 p-4">
              <h3 className="font-bold text-primary text-lg">นักการตลาดดิจิทัล (Digital Marketing Specialist)</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">เต็มเวลา</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">แผนกการตลาด</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">กรุงเทพฯ</span>
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium text-primary mb-1">คุณสมบัติ:</h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  <li>จบการศึกษาระดับปริญญาตรีขึ้นไป สาขาการตลาด หรือสาขาที่เกี่ยวข้อง</li>
                  <li>มีประสบการณ์ด้านการตลาดดิจิทัล 2 ปีขึ้นไป</li>
                  <li>มีความรู้ด้าน SEO, SEM, Social Media Marketing</li>
                  <li>มีความคิดสร้างสรรค์และทักษะการเขียนที่ดี</li>
                </ul>
              </div>
              
              <div className="text-right">
                <a 
                  href="/contact/careers/digital-marketing" 
                  className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  ดูรายละเอียดและสมัคร
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="/contact/careers/all" 
            className="text-accent hover:underline font-medium"
          >
            ดูตำแหน่งงานทั้งหมด
          </a>
        </div>
      </section>

      {/* ขั้นตอนการสมัคร */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ขั้นตอนการสมัครงาน</h2>
        
        <div className="space-y-8">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg mr-4">1</div>
            <div>
              <h3 className="font-bold text-primary mb-1">กรอกใบสมัครออนไลน์</h3>
              <p className="text-gray-700 text-sm">
                กรอกข้อมูลในใบสมัครออนไลน์ให้ครบถ้วน พร้อมแนบประวัติส่วนตัว (Resume) และเอกสารประกอบอื่นๆ
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg mr-4">2</div>
            <div>
              <h3 className="font-bold text-primary mb-1">การสัมภาษณ์เบื้องต้น</h3>
              <p className="text-gray-700 text-sm">
                หากคุณสมบัติตรงตามที่ต้องการ ทีมงานฝ่ายทรัพยากรบุคคลจะติดต่อเพื่อนัดสัมภาษณ์เบื้องต้นทางโทรศัพท์หรือวิดีโอคอล
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg mr-4">3</div>
            <div>
              <h3 className="font-bold text-primary mb-1">การสัมภาษณ์กับผู้จัดการฝ่าย</h3>
              <p className="text-gray-700 text-sm">
                ผู้สมัครที่ผ่านการสัมภาษณ์เบื้องต้นจะได้รับเชิญมาสัมภาษณ์กับผู้จัดการฝ่ายที่เกี่ยวข้อง เพื่อประเมินทักษะและความเหมาะสมกับตำแหน่งงาน
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg mr-4">4</div>
            <div>
              <h3 className="font-bold text-primary mb-1">การเสนอตำแหน่งงาน</h3>
              <p className="text-gray-700 text-sm">
                ผู้สมัครที่ผ่านการคัดเลือกจะได้รับข้อเสนอตำแหน่งงาน พร้อมรายละเอียดเงินเดือนและสวัสดิการ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ติดต่อฝ่ายทรัพยากรบุคคล */}
      <section className="bg-primary/10 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-primary mb-3">ติดต่อฝ่ายทรัพยากรบุคคล</h2>
        <p className="text-gray-700 mb-4">หากมีข้อสงสัยเกี่ยวกับตำแหน่งงานหรือกระบวนการสมัคร สามารถติดต่อฝ่ายทรัพยากรบุคคลของเราได้</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a 
            href="mailto:hr@pustar-thailand.com" 
            className="inline-flex items-center px-4 py-2 bg-white text-primary font-medium rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hr@pustar-thailand.com
          </a>
          <a 
            href="tel:+6621234573" 
            className="inline-flex items-center px-4 py-2 bg-white text-primary font-medium rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            02-123-4573
          </a>
        </div>
      </section>
    </div>
  );
} 