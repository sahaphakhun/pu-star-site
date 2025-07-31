export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-700 mb-4">
        ยินดีต้อนรับสู่ WINRICH DYNAMIC
      </h1>
      <p className="text-base sm:text-lg text-gray-700 max-w-2xl mb-8 leading-relaxed">
        ผู้นำด้านการจำหน่ายวัสดุก่อสร้างและอุปกรณ์อุตสาหกรรม คุณภาพสูง ราคาเป็นธรรม บริการมืออาชีพ
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/shop" className="bg-blue-600 text-white px-8 py-4 sm:px-6 sm:py-3 rounded-lg shadow hover:bg-blue-700 transition-colors text-lg sm:text-base font-semibold">เข้าสู่หน้าร้านค้า</a>
        <a href="/articles" className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">บทความ</a>
        <a href="/contact" className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">ติดต่อเรา</a>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">วัสดุก่อสร้าง</h3>
          <p className="text-gray-600 text-sm sm:text-base">คุณภาพสูง ได้มาตรฐาน</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-4xl mb-4">🔧</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">อุปกรณ์อุตสาหกรรม</h3>
          <p className="text-gray-600 text-sm sm:text-base">ครบครัน หลากหลาย</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <div className="text-4xl mb-4">🚚</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">จัดส่งรวดเร็ว</h3>
          <p className="text-gray-600 text-sm sm:text-base">บริการส่งถึงที่ทั่วประเทศ</p>
        </div>
      </div>
    </div>
  );
} 