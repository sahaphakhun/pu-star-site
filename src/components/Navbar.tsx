import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-primary/20 shadow-sm sticky top-0 z-50 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-end px-4 py-3">
        <div className="flex gap-6 text-gray-700 text-base font-medium">
          <Link href="/shop" className="hover:text-accent transition">ร้านค้า</Link>
          <Link href="/blog" className="hover:text-accent transition">บล็อก</Link>
          <Link href="/cart" className="hover:text-accent transition">สินค้า</Link>
          <Link href="/about" className="hover:text-accent transition">เกี่ยวกับ</Link>
          <Link href="/contact" className="hover:text-accent transition">ติดต่อ</Link>
        </div>
      </div>
    </nav>
  );
} 