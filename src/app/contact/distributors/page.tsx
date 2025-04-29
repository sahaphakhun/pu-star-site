import React from "react";

export default function DistributorsPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      {/* หัวข้อหน้า */}
      <section className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">ติดต่อตัวแทนจำหน่าย</h1>
        <p className="text-gray-600 mt-2">เป็นพันธมิตรทางธุรกิจกับ Next Star Innovation และเติบโตไปด้วยกัน</p>
      </section>

      {/* ข้อมูลโปรแกรมตัวแทนจำหน่าย */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4">โปรแกรมตัวแทนจำหน่าย Next Star Innovation</h2>
        <p className="text-gray-700 mb-3">
          บริษัท พูสตาร์ (ประเทศไทย) จำกัด กำลังขยายเครือข่ายตัวแทนจำหน่ายทั่วประเทศไทยและภูมิภาคเอเชียตะวันออกเฉียงใต้ เพื่อนำเสนอผลิตภัณฑ์ซีลแลนท์และกาวคุณภาพสูงให้ถึงมือลูกค้าทุกกลุ่ม
        </p>
        <p className="text-gray-700 mb-3">
          เรามองหาพันธมิตรทางธุรกิจที่มีเครือข่ายในวงการก่อสร้าง ตกแต่งภายใน หรืออุตสาหกรรมที่เกี่ยวข้อง เพื่อร่วมสร้างโอกาสทางธุรกิจที่ยั่งยืนไปด้วยกัน
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="font-bold text-primary mb-2">ข้อดีของการเป็นตัวแทนจำหน่าย</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>ผลิตภัณฑ์คุณภาพสูงที่ผ่านการรับรองมาตรฐานระดับสากล</li>
              <li>อัตรากำไรที่แข่งขันได้และน่าสนใจ</li>
              <li>การสนับสนุนด้านการตลาดและสื่อโฆษณา</li>
              <li>การฝึกอบรมผลิตภัณฑ์และการขายอย่างสม่ำเสมอ</li>
              <li>ทีมงานสนับสนุนด้านเทคนิคมืออาชีพ</li>
            </ul>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="font-bold text-primary mb-2">คุณสมบัติของตัวแทนจำหน่าย</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>เป็นนิติบุคคลที่จดทะเบียนถูกต้องตามกฎหมาย</li>
              <li>มีประสบการณ์ในธุรกิจวัสดุก่อสร้าง หรืออุตสาหกรรมที่เกี่ยวข้อง</li>
              <li>มีเครือข่ายลูกค้าและช่องทางการจัดจำหน่ายที่แข็งแกร่ง</li>
              <li>มีความสามารถในการลงทุนและพัฒนาตลาด</li>
              <li>มีทีมงานขายและการตลาดที่พร้อมผลักดันแบรนด์ Next Star Innovation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ประเภทตัวแทนจำหน่าย */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ประเภทตัวแทนจำหน่าย</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-primary p-3">
              <h3 className="font-bold text-white text-center">ตัวแทนจำหน่ายระดับประเทศ</h3>
            </div>
            <div className="p-4">
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                <li>สิทธิ์การจัดจำหน่ายทั่วประเทศ</li>
                <li>สิทธิ์ในการแต่งตั้งตัวแทนจำหน่ายย่อย</li>
                <li>ส่วนลดสูงสุดและเงื่อนไขพิเศษ</li>
                <li>การสนับสนุนด้านการตลาดเต็มรูปแบบ</li>
                <li>การฝึกอบรมเชิงลึกทั้งในและต่างประเทศ</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-primary font-medium">เงินลงทุนเริ่มต้น: สูง</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="bg-accent p-3">
              <h3 className="font-bold text-white text-center">ตัวแทนจำหน่ายระดับภูมิภาค</h3>
            </div>
            <div className="p-4">
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                <li>สิทธิ์การจัดจำหน่ายในภูมิภาคที่กำหนด</li>
                <li>ส่วนลดในระดับที่น่าสนใจ</li>
                <li>การสนับสนุนด้านการตลาดในระดับภูมิภาค</li>
                <li>การฝึกอบรมผลิตภัณฑ์และการขายประจำไตรมาส</li>
                <li>ทีมงานสนับสนุนด้านเทคนิคประจำภูมิภาค</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-primary font-medium">เงินลงทุนเริ่มต้น: ปานกลาง</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="bg-green-600 p-3">
              <h3 className="font-bold text-white text-center">ตัวแทนจำหน่ายระดับท้องถิ่น</h3>
            </div>
            <div className="p-4">
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                <li>สิทธิ์การจัดจำหน่ายในพื้นที่เฉพาะ</li>
                <li>ส่วนลดตามเป้าการขาย</li>
                <li>สื่อการตลาดและโปรโมชันสำหรับลูกค้า</li>
                <li>การฝึกอบรมพื้นฐานเกี่ยวกับผลิตภัณฑ์</li>
                <li>การสนับสนุนทางเทคนิคเมื่อต้องการ</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-primary font-medium">เงินลงทุนเริ่มต้น: ต่ำ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* แบบฟอร์มติดต่อ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">สนใจเป็นตัวแทนจำหน่าย</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company" className="block text-gray-700 font-medium mb-2">ชื่อบริษัท *</label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ชื่อบริษัทของคุณ"
              />
            </div>
            
            <div>
              <label htmlFor="business_type" className="block text-gray-700 font-medium mb-2">ประเภทธุรกิจ *</label>
              <select 
                id="business_type" 
                name="business_type" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">เลือกประเภทธุรกิจ</option>
                <option value="construction">วัสดุก่อสร้าง</option>
                <option value="interior">ตกแต่งภายใน</option>
                <option value="hardware">ฮาร์ดแวร์และเครื่องมือ</option>
                <option value="retail">ค้าปลีก</option>
                <option value="wholesale">ค้าส่ง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">ชื่อผู้ติดต่อ *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-gray-700 font-medium mb-2">ตำแหน่ง *</label>
              <input 
                type="text" 
                id="position" 
                name="position" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ตำแหน่งของคุณ"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">อีเมล *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="example@company.com"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">เบอร์โทรศัพท์ *</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="081-234-5678"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-gray-700 font-medium mb-2">พื้นที่ที่สนใจเป็นตัวแทนจำหน่าย *</label>
              <select 
                id="location" 
                name="location" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">เลือกพื้นที่</option>
                <option value="country">ทั่วประเทศ</option>
                <option value="north">ภาคเหนือ</option>
                <option value="northeast">ภาคตะวันออกเฉียงเหนือ</option>
                <option value="central">ภาคกลาง</option>
                <option value="east">ภาคตะวันออก</option>
                <option value="west">ภาคตะวันตก</option>
                <option value="south">ภาคใต้</option>
                <option value="local">เฉพาะในจังหวัด/อำเภอ</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="distributor_type" className="block text-gray-700 font-medium mb-2">ประเภทตัวแทนจำหน่ายที่สนใจ *</label>
              <select 
                id="distributor_type" 
                name="distributor_type" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">เลือกประเภท</option>
                <option value="national">ตัวแทนจำหน่ายระดับประเทศ</option>
                <option value="regional">ตัวแทนจำหน่ายระดับภูมิภาค</option>
                <option value="local">ตัวแทนจำหน่ายระดับท้องถิ่น</option>
                <option value="not_sure">ยังไม่แน่ใจ ต้องการข้อมูลเพิ่มเติม</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="experience" className="block text-gray-700 font-medium mb-2">ประสบการณ์ในธุรกิจ *</label>
            <textarea 
              id="experience" 
              name="experience" 
              rows={3} 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="โปรดระบุประสบการณ์ของบริษัทในธุรกิจที่เกี่ยวข้อง และเครือข่ายลูกค้าที่มีอยู่"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-gray-700 font-medium mb-2">ข้อความเพิ่มเติม</label>
            <textarea 
              id="message" 
              name="message" 
              rows={4} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ข้อความหรือคำถามเพิ่มเติมที่ต้องการสอบถาม"
            ></textarea>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="privacy" 
              name="privacy" 
              required 
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
              ฉันยอมรับ<a href="/privacy-policy" className="text-accent hover:underline">นโยบายความเป็นส่วนตัว</a>และยินยอมให้ติดต่อกลับเพื่อแจ้งข้อมูลเพิ่มเติม *
            </label>
          </div>
          
          <div>
            <button 
              type="submit" 
              className="px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              ส่งข้อมูลการสมัคร
            </button>
          </div>
        </form>
      </section>

      {/* ติดต่อโดยตรง */}
      <section className="bg-primary/10 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-primary mb-3">ต้องการข้อมูลเพิ่มเติม?</h2>
        <p className="text-gray-700 mb-4">ติดต่อฝ่ายพัฒนาธุรกิจของเราโดยตรงเพื่อพูดคุยเกี่ยวกับโอกาสทางธุรกิจ</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a 
            href="mailto:partnership@pustar-thailand.com" 
            className="inline-flex items-center px-4 py-2 bg-white text-primary font-medium rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            partnership@pustar-thailand.com
          </a>
          <a 
            href="tel:+6621234568" 
            className="inline-flex items-center px-4 py-2 bg-white text-primary font-medium rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            02-123-4568
          </a>
        </div>
      </section>
    </div>
  );
} 