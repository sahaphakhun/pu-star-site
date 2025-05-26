export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4">ยินดีต้อนรับสู่ Next Star Innovations</h1>
      <p className="text-gray-700 max-w-xl mb-8">
       ...........
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <a href="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors">เข้าสู่หน้าร้านค้า</a>
        <a href="/articles" className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">บทความ</a>
        <a href="/contact" className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">ติดต่อเรา</a>
      </div>
    </div>
  );
} 