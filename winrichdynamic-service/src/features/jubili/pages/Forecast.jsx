export default function Forecast() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">คาดการณ์</h1>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              หน้านี้อยู่ระหว่างการพัฒนา
            </h2>
            <p className="text-gray-600 mb-6">
              ฟีเจอร์คาดการณ์ยอดขายและรายได้กำลังอยู่ในระหว่างการพัฒนา
            </p>
            <div className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
