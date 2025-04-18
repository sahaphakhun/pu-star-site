"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

const menu = [
  {
    label: "สินค้าของเรา",
    href: "/products",
    sub: [
      { label: "ซีลแลนท์ (Sealant)", href: "/products/sealant" },
      { label: "กาว (Adhesive)", href: "/products/adhesive" },
      { label: "อุปกรณ์เสริม", href: "/products/accessories" },
      { label: "สินค้าทั้งหมด", href: "/products/all" },
    ],
  },
  {
    label: "เกี่ยวกับบริษัท",
    href: "/about",
    sub: [
      { label: "ประวัติบริษัท", href: "/about/history" },
      { label: "ฐานการผลิต", href: "/about/facilities" },
      { label: "ทีมงานวิจัยและพัฒนา", href: "/about/research" },
      { label: "ใบรับรองและมาตรฐาน", href: "/about/certificates" },
    ],
  },
  {
    label: "บทความ",
    href: "/articles",
    sub: [
      { label: "คู่มือการใช้งาน", href: "/articles/manuals" },
      { label: "เทคนิคการใช้งาน", href: "/articles/techniques" },
      { label: "นวัตกรรมใหม่", href: "/articles/innovations" },
      { label: "ข่าวสารอุตสาหกรรม", href: "/articles/industry-news" },
      { label: "ข่าวกิจกรรมบริษัท", href: "/articles/company-news" },
    ],
  },
  {
    label: "บริการลูกค้า",
    href: "/customer-service",
    sub: [
      { label: "คำถามที่พบบ่อย", href: "/customer-service/faq" },
      { label: "ดาวน์โหลดเอกสาร", href: "/customer-service/downloads" },
      { label: "ติดต่อฝ่ายเทคนิค", href: "/customer-service/technical-support" },
      { label: "แจ้งปัญหาสินค้า", href: "/customer-service/report-issue" },
    ],
  },
  {
    label: "ติดต่อเรา",
    href: "/contact",
    sub: [
      { label: "ข้อมูลติดต่อ", href: "/contact/info" },
      { label: "สาขาทั่วโลก", href: "/contact/global" },
      { label: "ร่วมงานกับเรา", href: "/contact/careers" },
      { label: "ติดต่อตัวแทนจำหน่าย", href: "/contact/distributors" },
    ],
  },
];

export default function Sidebar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจจับขนาดหน้าจอเพื่อกำหนด Mobile mode
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // เรียกครั้งแรกเมื่อโหลดหน้า
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* ปุ่มแฮมเบอร์เกอร์สำหรับมือถือ */}
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-primary/20"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="เปิด/ปิดเมนู"
        >
          <div className="w-6 h-0.5 bg-primary mb-1.5"></div>
          <div className="w-6 h-0.5 bg-primary mb-1.5"></div>
          <div className="w-6 h-0.5 bg-primary"></div>
        </button>
      )}

      {/* แถบด้านซ้าย - แสดงตลอดเวลาบน Desktop หรือแสดงเมื่อเปิดเมนูบน Mobile */}
      <aside 
        className={`${isMobile ? 'fixed inset-0 z-40' : 'w-64 min-h-screen'} 
                  ${isMobile && !isMobileMenuOpen ? 'translate-x-[-100%]' : 'translate-x-0'}
                  bg-white border-r border-primary/20 flex flex-col items-center py-8 shadow-md
                  transition-transform duration-300 ease-in-out`}
      >
        {/* ปุ่มปิดเมนูบนมือถือ */}
        {isMobile && (
          <button
            className="absolute top-4 right-4 text-2xl"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="ปิดเมนู"
          >
            ✕
          </button>
        )}

        <div className="mb-10">
          <Link href="/" onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            <Image src="/logo.jpg" alt="PU STAR Logo" width={isMobile ? 80 : 120} height={isMobile ? 80 : 120} priority />
          </Link>
        </div>
        
        <nav className="flex flex-col gap-3 w-full px-4 overflow-y-auto">
          {menu.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => !isMobile && setHovered(item.label)}
              onMouseLeave={() => !isMobile && setHovered(null)}
              onClick={() => isMobile && setHovered(hovered === item.label ? null : item.label)}
            >
              <Link
                href={isMobile ? '#' : item.href}
                className="block px-4 py-2 rounded hover:bg-primary/10 text-primary font-medium text-lg transition"
                onClick={(e) => {
                  if (isMobile) {
                    e.preventDefault();
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                {item.label}
                {isMobile && (
                  <span className="float-right">
                    {hovered === item.label ? '▼' : '▶'}
                  </span>
                )}
              </Link>

              {item.sub && (
                <div 
                  className={`
                    ${isMobile 
                      ? `relative w-full bg-white/80 overflow-hidden transition-all duration-300 ease-in-out ${hovered === item.label ? 'max-h-[500px] opacity-100 py-2' : 'max-h-0 opacity-0'}` 
                      : `absolute left-full top-0 ml-2 bg-white border border-primary/20 rounded shadow-lg min-w-[200px] z-20 ${hovered === item.label ? 'block' : 'hidden'}`
                    }
                  `}
                >
                  {item.sub.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className={`
                        block px-4 py-2 hover:bg-accent/10 text-primary text-base
                        ${isMobile ? 'pl-8' : ''}
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay สำหรับปิดเมนูเมื่อคลิกด้านนอก */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
} 