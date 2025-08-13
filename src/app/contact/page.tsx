"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    category: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: result.message
        });
        // รีเซ็ตฟอร์มหลังจากส่งสำเร็จ
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          category: '',
          message: ''
        });
      } else {
        setSubmitResult({
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการส่งข้อความ'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto">
      {/* หัวข้อหน้า */}
      <section className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">ติดต่อเรา</h1>
        <p className="text-gray-600 mt-2">พร้อมให้บริการและตอบคำถามทุกความต้องการของคุณ</p>
      </section>

      {/* ข้อมูลติดต่อ + แผนที่ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ข้อมูลติดต่อ */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
          <h2 className="text-2xl font-semibold text-primary mb-4">ข้อมูลติดต่อ</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-primary mb-2">สำนักงานใหญ่ (จีน)</h3>
              <p className="text-gray-700">Dongfeng East Road, Qingxi Town, Dongguan City, Guangdong Province, China</p>
              <p className="text-gray-700 mt-1">โทรศัพท์: 0769-82010650, 0769-81289105</p>
              <p className="text-gray-700">อีเมล: ccy@winrich.com, hjq@winrich.com</p>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-2">สำนักงานไทย</h3>
              <p className="text-gray-700">123/456 อาคารพูสตาร์ ชั้น 15 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110</p>
              <p className="text-gray-700 mt-1">โทรศัพท์: 02-123-4567</p>
              <p className="text-gray-700">อีเมล: info@winrich-thailand.com</p>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-2">ฝ่ายขายและการตลาด</h3>
              <p className="text-gray-700">โทรศัพท์: 02-123-4568</p>
              <p className="text-gray-700">อีเมล: sales@winrich-thailand.com</p>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-2">ฝ่ายเทคนิคและบริการลูกค้า</h3>
              <p className="text-gray-700">โทรศัพท์: 02-123-4569</p>
              <p className="text-gray-700">อีเมล: support@winrich-thailand.com</p>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-2">เวลาทำการ</h3>
              <p className="text-gray-700">จันทร์ - ศุกร์: 8:30 - 17:30 น.</p>
              <p className="text-gray-700">เสาร์: 9:00 - 13:00 น.</p>
              <p className="text-gray-700">วันอาทิตย์และวันหยุดนักขัตฤกษ์: ปิดทำการ</p>
            </div>
          </div>
        </div>
        
        {/* แผนที่ Google */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10 h-full">
          <h2 className="text-2xl font-semibold text-primary mb-4">แผนที่สำนักงาน</h2>
          <div className="h-[400px] relative bg-gray-200 rounded-md overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.7511169832493!2d100.5610995107805!3d13.731789487950742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzQ0LjQiTiAxMDDCsDMzJzQ0LjEiRQ!5e0!3m2!1sen!2sth!4v1650123456789!5m2!1sen!2sth"
              width="100%"
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
          </div>
        </div>
      </section>

      {/* แบบฟอร์มติดต่อ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">ส่งข้อความถึงเรา</h2>
        
        {/* แสดงผลการส่ง */}
        {submitResult && (
          <div className={`mb-6 p-4 rounded-md ${
            submitResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {submitResult.success ? (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {submitResult.message}
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {submitResult.error}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">ชื่อ-นามสกุล *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">อีเมล *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">เบอร์โทรศัพท์</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label htmlFor="company" className="block text-gray-700 font-medium mb-2">บริษัท/องค์กร</label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">หัวข้อ *</label>
            <input 
              type="text" 
              id="subject" 
              name="subject" 
              value={formData.subject}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-gray-700 font-medium mb-2">ประเภทการติดต่อ *</label>
            <select 
              id="category" 
              name="category" 
              value={formData.category}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">กรุณาเลือกประเภทการติดต่อ</option>
              <option value="sales">สอบถามข้อมูลสินค้า/บริการ</option>
              <option value="support">ขอรับการสนับสนุนทางเทคนิค</option>
              <option value="partnership">ติดต่อเรื่องความร่วมมือ/ตัวแทนจำหน่าย</option>
              <option value="complaint">แจ้งปัญหาการใช้งานสินค้า</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-gray-700 font-medium mb-2">ข้อความ *</label>
            <textarea 
              id="message" 
              name="message" 
              rows={6} 
              value={formData.message}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              ฉันยอมรับ<a href="/privacy-policy" className="text-accent hover:underline">นโยบายความเป็นส่วนตัว</a>และยินยอมให้เก็บข้อมูลของฉัน *
            </label>
          </div>
          
          <div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-6 py-3 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความ'}
            </button>
          </div>
        </form>
      </section>

      {/* ช่องทางติดต่ออื่นๆ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">อีเมล</h3>
          <p className="text-gray-600 mb-4">ส่งอีเมลถึงเราโดยตรง</p>
          <a href="mailto:info@pustar-thailand.com" className="text-accent hover:underline">info@pustar-thailand.com</a>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">โทรศัพท์</h3>
          <p className="text-gray-600 mb-4">โทรหาเราได้ทุกวันทำการ</p>
          <a href="tel:+6621234567" className="text-accent hover:underline">02-123-4567</a>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Line Official</h3>
          <p className="text-gray-600 mb-4">ติดต่อผ่าน Line ได้ตลอด 24 ชม.</p>
          <span className="text-accent">@pustar-thailand</span>
        </div>
      </section>

      {/* FAQ ย่อย */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6">คำถามที่พบบ่อย</h2>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ต้องการคำแนะนำในการเลือกซีลแลนท์หรือกาวสำหรับงานเฉพาะทางได้อย่างไร?</h3>
            <p className="text-gray-700">คุณสามารถติดต่อฝ่ายเทคนิคของเราโดยตรงที่ support@pustar-thailand.com หรือโทร 02-123-4569 ทีมงานผู้เชี่ยวชาญของเราพร้อมให้คำแนะนำเฉพาะทางตามความต้องการของคุณ</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฉันจะสั่งซื้อผลิตภัณฑ์ในปริมาณมากได้อย่างไร?</h3>
            <p className="text-gray-700">สำหรับการสั่งซื้อจำนวนมาก โปรดติดต่อฝ่ายขายของเราที่ sales@pustar-thailand.com หรือโทร 02-123-4568 เพื่อรับข้อเสนอราคาพิเศษและบริการที่เหมาะกับความต้องการของคุณ</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-bold text-primary mb-2">ฉันจะสมัครเป็นตัวแทนจำหน่ายได้อย่างไร?</h3>
            <p className="text-gray-700">หากคุณสนใจเป็นตัวแทนจำหน่ายผลิตภัณฑ์ Next Star Innovation ในประเทศไทย โปรดส่งอีเมลมาที่ partnership@pustar-thailand.com พร้อมแนบประวัติบริษัท และแผนธุรกิจ ทีมงานของเราจะติดต่อกลับภายใน 3 วันทำการ</p>
          </div>
          
          <div>
            <h3 className="font-bold text-primary mb-2">ผลิตภัณฑ์ Next Star Innovation มีการรับประกันหรือไม่?</h3>
            <p className="text-gray-700">ผลิตภัณฑ์ทุกชิ้นของ Next Star Innovation ได้รับการรับประกันคุณภาพตามที่ระบุไว้ในเอกสารผลิตภัณฑ์ หากพบปัญหาใดๆ กรุณาติดต่อฝ่ายบริการลูกค้าของเราทันทีที่ support@pustar-thailand.com</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/customer-service/faq" className="text-accent hover:underline font-medium">ดูคำถามที่พบบ่อยทั้งหมด</a>
        </div>
      </section>
    </div>
  );
} 