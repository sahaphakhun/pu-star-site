import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'ซีลแลนท์ | Next Star Innovation THAILAND',
  description: 'ผลิตภัณฑ์ซีลแลนท์คุณภาพสูงจาก Next Star Innovation สำหรับงานก่อสร้างและตกแต่งภายใน',
}

export default function SealantPage() {
  // ข้อมูลสินค้าประเภทซีลแลนท์
  const sealantProducts = [
    {
      id: 'pu-sealant-40',
      name: 'PU-40 - โพลียูรีเทนซีลแลนท์',
      description: 'ซีลแลนท์โพลียูรีเทนคุณภาพสูง สำหรับงานยาแนวรอยต่อคอนกรีต โลหะ ไม้ และวัสดุก่อสร้างทั่วไป',
      price: 280,
      colors: ['ขาว', 'เทา', 'ดำ'],
      features: [
        'ยืดหยุ่นสูง',
        'ทนต่อสภาพอากาศ',
        'ใช้ได้ทั้งภายในและภายนอก',
        'การยึดเกาะดีเยี่ยม'
      ],
      image: '/pu-40.jpg',
      rating: 4.8,
      reviews: 156,
      inStock: true,
    },
    {
      id: 'silicon-sealant-neutral',
      name: 'ซิลิโคนซีลแลนท์ สูตรกลาง',
      description: 'ซิลิโคนซีลแลนท์สูตรกลาง ไม่กัดกร่อนพื้นผิว เหมาะสำหรับงานกระจก อลูมิเนียม และวัสดุที่ไวต่อการกัดกร่อน',
      price: 220,
      colors: ['ใส', 'ขาว', 'ดำ'],
      features: [
        'ไม่กัดกร่อนพื้นผิว',
        'คุณภาพสูง',
        'ทนต่อรังสียูวี',
        'ไม่เปลี่ยนสี'
      ],
      image: '/silicon-neutral.jpg',
      rating: 4.7,
      reviews: 124,
      inStock: true,
    },
    {
      id: 'pu-sealant-25',
      name: 'PU-25 - โพลียูรีเทนซีลแลนท์ ชนิดไหลตัวต่ำ',
      description: 'ซีลแลนท์โพลียูรีเทนไหลตัวต่ำ เหมาะสำหรับงานยาแนวในแนวดิ่งและเพดาน ไม่ย้อยตัว',
      price: 250,
      colors: ['ขาว', 'เทา', 'ดำ'],
      features: [
        'ไม่ย้อยตัวในแนวดิ่ง',
        'ทนต่อสภาพอากาศ',
        'ใช้ได้ทั้งภายในและภายนอก',
        'ทาสีทับได้'
      ],
      image: '/pu-25.jpg',
      rating: 4.6,
      reviews: 87,
      inStock: true,
    },
    {
      id: 'acrylic-sealant',
      name: 'อะคริลิคซีลแลนท์',
      description: 'ซีลแลนท์อะคริลิคสำหรับงานภายใน ทาสีทับได้ง่าย ล้างทำความสะอาดด้วยน้ำ',
      price: 180,
      colors: ['ขาว'],
      features: [
        'ทาสีทับได้ง่าย',
        'ล้างด้วยน้ำได้',
        'ไร้กลิ่นรุนแรง',
        'ใช้งานภายใน'
      ],
      image: '/acrylic.jpg',
      rating: 4.5,
      reviews: 62,
      inStock: true,
    },
    {
      id: 'silicon-sealant-acid',
      name: 'ซิลิโคนซีลแลนท์ สูตรกรด',
      description: 'ซิลิโคนซีลแลนท์สูตรกรด เหมาะสำหรับงานกระจกและเซรามิก ในพื้นที่เปียกชื้น เช่น ห้องน้ำ',
      price: 190,
      colors: ['ใส', 'ขาว'],
      features: [
        'ป้องกันเชื้อรา',
        'กันน้ำ 100%',
        'ทนทานในพื้นที่เปียกชื้น',
        'แห้งเร็ว'
      ],
      image: '/silicon-acid.jpg',
      rating: 4.6,
      reviews: 94,
      inStock: true,
    },
    {
      id: 'hybrid-sealant',
      name: 'ไฮบริดซีลแลนท์',
      description: 'ซีลแลนท์ไฮบริดเทคโนโลยีใหม่ รวมข้อดีของโพลียูรีเทนและซิลิโคน ปลอดภัยต่อสิ่งแวดล้อม',
      price: 350,
      colors: ['ขาว', 'เทา', 'ดำ'],
      features: [
        'เป็นมิตรกับสิ่งแวดล้อม',
        'ไม่มีไอโซไซยาเนต',
        'ทนทานสูง',
        'ยึดเกาะได้หลายวัสดุ'
      ],
      image: '/hybrid.jpg',
      rating: 4.9,
      reviews: 42,
      inStock: true,
    },
    {
      id: 'fireproof-sealant',
      name: 'ซีลแลนท์ทนไฟ',
      description: 'ซีลแลนท์ทนไฟสำหรับงานป้องกันการลุกลามของไฟ ผ่านการรับรองมาตรฐานความปลอดภัย',
      price: 420,
      colors: ['แดง'],
      features: [
        'ทนไฟได้ถึง 4 ชั่วโมง',
        'ป้องกันควันและก๊าซร้อน',
        'เหมาะสำหรับอาคารสูง',
        'ผ่านมาตรฐาน BS EN 1366-4'
      ],
      image: '/fireproof.jpg',
      rating: 4.8,
      reviews: 36,
      inStock: true,
    },
    {
      id: 'underwater-sealant',
      name: 'ซีลแลนท์ใช้งานใต้น้ำ',
      description: 'ซีลแลนท์พิเศษสามารถใช้งานใต้น้ำได้ สำหรับงานซ่อมแซมสระว่ายน้ำ บ่อปลา หรืองานที่ต้องสัมผัสน้ำตลอดเวลา',
      price: 380,
      colors: ['ใส', 'ขาว'],
      features: [
        'ติดตั้งใต้น้ำได้',
        'ยึดเกาะแม้ในพื้นผิวเปียก',
        'ปลอดภัยต่อสัตว์น้ำ',
        'ทนทานต่อคลอรีน'
      ],
      image: '/underwater.jpg',
      rating: 4.7,
      reviews: 28,
      inStock: true,
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ส่วนหัว */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">ซีลแลนท์ (Sealant)</h1>
            <p className="text-gray-600 max-w-2xl">
              ผลิตภัณฑ์ซีลแลนท์คุณภาพสูงสำหรับงานก่อสร้างและตกแต่งภายใน ป้องกันการรั่วซึมและทนทานต่อสภาพอากาศ
            </p>
          </div>
          <nav className="flex space-x-2 mt-4 md:mt-0 text-sm">
            <Link href="/products" className="text-gray-600 hover:text-primary">
              สินค้า
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">ซีลแลนท์</span>
          </nav>
        </div>
      </div>

      {/* ตัวกรองและจัดเรียง */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary/10">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  เรียงตาม
                </label>
                <select 
                  id="sort" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ยอดนิยม</option>
                  <option>ราคา: ต่ำ-สูง</option>
                  <option>ราคา: สูง-ต่ำ</option>
                  <option>ใหม่ล่าสุด</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  สี
                </label>
                <select 
                  id="color" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ทั้งหมด</option>
                  <option>ขาว</option>
                  <option>ใส</option>
                  <option>เทา</option>
                  <option>ดำ</option>
                  <option>แดง</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <p className="text-sm text-gray-500">
                แสดง {sealantProducts.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sealantProducts.map((product) => (
            <Link 
              key={product.id}
              href={`/products/sealant/${product.id}`}
              className="group block bg-white rounded-lg shadow overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 border border-primary/10"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {!product.inStock && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    สินค้าหมด
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-amber-400">★</span>
                    <span className="text-sm ml-1 text-gray-700">{product.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">({product.reviews} รีวิว)</span>
                </div>
                
                <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-500">สี:</span>
                    {product.colors.map((color, index) => (
                      <span key={index} className="text-xs text-gray-700">{color}{index < product.colors.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-accent">{product.price} บาท</span>
                  <span className="inline-block px-3 py-1 bg-accent text-white rounded-md text-sm transition-colors hover:bg-accent/90">
                    ดูรายละเอียด
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* ข้อมูลเกี่ยวกับซีลแลนท์ */}
      <div className="max-w-6xl mx-auto mt-16">
        <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
          <h2 className="text-2xl font-semibold text-primary mb-4">ทำไมต้องเลือกซีลแลนท์จาก Next Star Innovation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                ซีลแลนท์จาก Next Star Innovation ถูกพัฒนาด้วยเทคโนโลยีล่าสุดจากทีมวิจัยและพัฒนาที่มีประสบการณ์สูง ทำให้ได้ผลิตภัณฑ์ที่มีคุณภาพเหนือชั้น
                ตอบโจทย์ทุกความต้องการในงานก่อสร้างและตกแต่ง
              </p>
              <p className="text-gray-700">
                ผลิตภัณฑ์ของเราผ่านการทดสอบและได้รับการรับรองมาตรฐานระดับสากล มั่นใจได้ในคุณภาพและความปลอดภัย
                พร้อมใช้งานได้หลากหลายรูปแบบทั้งในงานภายในและภายนอกอาคาร
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">คุณสมบัติเด่น</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700">ยึดเกาะดีเยี่ยมกับวัสดุหลากหลายชนิด</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700">ทนทานต่อสภาวะอากาศและรังสียูวี</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700">ยืดหยุ่นสูง ไม่แตกร้าวเมื่อวัสดุขยายหรือหดตัว</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700">อายุการใช้งานยาวนาน ลดค่าใช้จ่ายในการบำรุงรักษา</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700">มีให้เลือกหลากหลายสี เข้ากับทุกงานตกแต่ง</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 