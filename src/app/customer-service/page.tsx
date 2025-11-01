import Link from "next/link";

const serviceCategories = [
  {
    title: "คำถามที่พบบ่อย",
    description: "ค้นหาคำตอบสำหรับคำถามทั่วไปเกี่ยวกับผลิตภัณฑ์และบริการของเรา",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: "/customer-service/faq",
  },
  {
    title: "ข้อมูลการรับประกัน",
    description: "เรียนรู้เกี่ยวกับนโยบายการรับประกันและวิธีการเคลมสินค้า",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    href: "/customer-service/warranty",
  },
  {
    title: "คู่มือการใช้งาน",
    description: "ดาวน์โหลดคู่มือการใช้งานสำหรับผลิตภัณฑ์ทุกประเภทของเรา",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    href: "/customer-service/manuals",
  },
  {
    title: "ใบรับรองผลิตภัณฑ์",
    description: "ดาวน์โหลดใบรับรองคุณภาพและมาตรฐานต่างๆ สำหรับผลิตภัณฑ์ของเรา",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    href: "/customer-service/certificates",
  },
  {
    title: "วิดีโอสาธิตการใช้งาน",
    description: "ชมวิดีโอสาธิตการใช้งานผลิตภัณฑ์และเทคนิคการใช้งานที่ถูกต้อง",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    href: "/customer-service/videos",
  },
  {
    title: "ติดต่อฝ่ายสนับสนุน",
    description: "ติดต่อทีมงานฝ่ายสนับสนุนของเราเพื่อขอความช่วยเหลือเพิ่มเติม",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    href: "/contact",
  },
];

export default function CustomerServicePage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-primary mb-2">บริการลูกค้า</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          เราพร้อมให้บริการและช่วยเหลือคุณทุกขั้นตอน เลือกหมวดหมู่ด้านล่างเพื่อค้นหาข้อมูลที่คุณต้องการ
        </p>
      </div>

      {/* กริดแสดงหมวดหมู่บริการ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceCategories.map((category, index) => (
          <Link 
            key={index} 
            href={category.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-primary/10 flex flex-col h-full"
          >
            <div className="text-primary mb-4">{category.icon}</div>
            <h2 className="text-xl font-semibold text-primary mb-2">{category.title}</h2>
            <p className="text-gray-600 mb-4 flex-grow">{category.description}</p>
            <div className="text-accent font-medium flex items-center">
              <span>ดูเพิ่มเติม</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* ส่วนการติดต่อด่วน */}
      <div className="mt-16 bg-primary/5 rounded-lg p-8 border border-primary/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-2">ต้องการความช่วยเหลือเร่งด่วน?</h2>
          <p className="text-gray-600">
            ทีมงานบริการลูกค้าของเราพร้อมช่วยเหลือคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-primary mb-1">อีเมล</h3>
            <p className="text-gray-600 text-sm mb-2">ตอบกลับภายใน 24 ชั่วโมง</p>
            <a href="mailto:support@pustar-thailand.com" className="text-accent hover:underline">support@pustar-thailand.com</a>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-medium text-primary mb-1">โทรศัพท์</h3>
            <p className="text-gray-600 text-sm mb-2">จันทร์-ศุกร์, 8:30 - 17:30 น.</p>
            <a href="tel:021234567" className="text-accent hover:underline">02-123-4567</a>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-medium text-primary mb-1">แชทออนไลน์</h3>
            <p className="text-gray-600 text-sm mb-2">ทุกวัน, 9:00 - 18:00 น.</p>
            <a href="#" className="text-accent hover:underline">เริ่มแชทเลย</a>
          </div>
        </div>
      </div>
    </div>
  );
} 