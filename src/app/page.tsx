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
          <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">วัสดุก่อสร้าง</h3>
          <p className="text-gray-600 text-sm sm:text-base">คุณภาพสูง ได้มาตรฐาน</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">อุปกรณ์อุตสาหกรรม</h3>
          <p className="text-gray-600 text-sm sm:text-base">ครบครัน หลากหลาย</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">จัดส่งรวดเร็ว</h3>
          <p className="text-gray-600 text-sm sm:text-base">บริการส่งถึงที่ทั่วประเทศ</p>
        </div>
      </div>
    </div>
  );
} 