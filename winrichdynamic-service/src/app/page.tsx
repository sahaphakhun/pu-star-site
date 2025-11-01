'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-xl px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          สวัสดี
        </h1>
        <p className="mt-3 text-gray-600">
          WinRich Dynamic B2B — โซลูชันสำหรับธุรกิจของคุณ
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/shop" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              เข้าสู่ร้านค้า
            </button>
          </Link>
          <Link href="/adminb2b" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors">
              ไปที่ระบบจัดการ B2B
            </button>
          </Link>
          <Link href="/contact" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              ติดต่อเรา
            </button>
          </Link>
        </div>

        <div className="mt-10 text-xs text-gray-400">
          หน้านี้จะเป็น B2B shop ในอนาคต
        </div>
      </div>
    </main>
  );
}
