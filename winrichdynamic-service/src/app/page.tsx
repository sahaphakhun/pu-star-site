export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          WinRich Dynamic Service
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          ระบบจัดการใบเสนอราคา และบริหารธุรกิจ
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ระบบใบเสนอราคา
            </h3>
            <p className="text-gray-600">
              สร้างและจัดการใบเสนอราคาอย่างมืออาชีพ
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              LINE Bot Integration
            </h3>
            <p className="text-gray-600">
              เชื่อมต่อกับ LINE Official Account
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ระบบคลังสินค้า
            </h3>
            <p className="text-gray-600">
              ซิงค์ข้อมูลสต็อกแบบ Real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
