"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const menu = [
  {
    label: "สินค้า",
    href: "/products",
    sub: [
      { label: "ซีลแลนท์ (Sealant)", href: "/products/sealant" },
      { label: "กาว (Adhesive)", href: "/products/adhesive" },
      { label: "อุปกรณ์เสริม", href: "/products/accessories" },
      { label: "สินค้าทั้งหมด", href: "/products/all" },
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
      { label: "บทความทั้งหมด", href: "/articles" },
    ],
  },
  {
    label: "คำถามที่พบบ่อย",
    href: "/customer-service",
    sub: [
      { label: "คำถามทั้งหมด", href: "/customer-service/faq" },
      { label: "การใช้งานผลิตภัณฑ์", href: "/customer-service/faq?category=ผลิตภัณฑ์และการใช้งาน" },
      { label: "การสั่งซื้อและจัดส่ง", href: "/customer-service/faq?category=การสั่งซื้อและจัดส่ง" },
      { label: "บริการหลังการขาย", href: "/customer-service/faq?category=บริการหลังการขาย" },
      { label: "ข้อมูลทั่วไป", href: "/customer-service/faq?category=ข้อมูลทั่วไป" },
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
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // ฟังก์ชันจัดการการออกจากระบบ
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };
  
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
        className={`
          ${isMobile
            ? 'fixed inset-0 z-40 overflow-hidden'
            : 'w-64 h-screen sticky top-0 overflow-visible z-20'}
          ${isMobile && !isMobileMenuOpen ? ' translate-x-[-100%]' : ' translate-x-0'}
          bg-white border-r border-primary/20 flex flex-col shadow-md
          transition-transform duration-300 ease-in-out
        `}
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

        <div className="p-4 flex justify-center">
          <Link href="/" onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            <Image src="/logo.jpg" alt="PU STAR Logo" width={isMobile ? 80 : 100} height={isMobile ? 80 : 100} priority />
          </Link>
        </div>
        
        {/* ใช้ flex-1 และ overflow-auto เพื่อให้เมนูสามารถเลื่อนได้ */}
        <nav className="flex-1 overflow-auto px-4 py-2">
          {menu.map((item, index) => (
            <div
              key={item.label}
              className="relative mb-1"
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
                      : `fixed z-50 left-60 ${hovered === item.label ? 'block' : 'hidden'}`
                    }
                  `}
                  style={!isMobile ? { top: `${index * 40 + 140}px` } : {}}
                >
                  <div className={`
                    ${!isMobile ? 'bg-white border border-primary/20 rounded-md shadow-lg p-2 min-w-[250px]' : ''}
                  `}>
                    {item.sub.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`
                          block px-4 py-2 hover:bg-accent/10 text-primary text-base transition-colors rounded
                          ${isMobile ? 'pl-8' : ''}
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ส่วนล็อกอิน/ล็อกเอาท์ ด้านล่าง - มี height คงที่ ไม่ขยายตาม content */}
        <div className="w-full px-4 py-3 border-t border-primary/10 shrink-0">
          {status === "loading" ? (
            <div className="text-center text-gray-500 text-sm">กำลังโหลด...</div>
          ) : session ? (
            <div className="flex flex-col gap-2">
              <div className="text-center text-primary font-medium mb-1">
                สวัสดี, {session.user.username}
                <span className="text-xs ml-1 text-gray-500">
                  ({session.user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"})
                </span>
              </div>
              
              {session.user.role === "admin" && (
                <Link
                  href="/create-admin"
                  className="w-full rounded-md bg-gray-100 py-2 px-4 text-center text-primary text-sm hover:bg-gray-200 transition"
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                >
                  จัดการผู้ดูแลระบบ
                </Link>
              )}
              
              <button
                onClick={handleSignOut}
                className="w-full rounded-md bg-red-100 py-2 px-4 text-red-600 text-sm hover:bg-red-200 transition"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full rounded-md bg-primary py-2 px-4 text-center text-white text-sm hover:bg-primary/90 transition"
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                เข้าสู่ระบบ
              </Link>
              
              <Link
                href="/register"
                className="w-full rounded-md bg-gray-100 py-2 px-4 text-center text-primary text-sm hover:bg-gray-200 transition"
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
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