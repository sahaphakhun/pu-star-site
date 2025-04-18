import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'อุปกรณ์เสริม | PU STAR THAILAND',
  description: 'อุปกรณ์เสริมคุณภาพสูงสำหรับงานซีลแลนท์และกาว เพื่อการใช้งานที่สะดวกและมีประสิทธิภาพ',
}

export default function AccessoriesPage() {
  // ข้อมูลสินค้าประเภทอุปกรณ์เสริม
  const accessoriesProducts = [
    {
      id: 'sealant-gun',
      name: 'ปืนยิงซีลแลนท์ระดับมืออาชีพ',
      description: 'ปืนยิงซีลแลนท์คุณภาพสูง ออกแบบสำหรับมืออาชีพ ใช้งานง่าย ลดความเมื่อยล้า',
      price: 450,
      colors: ['ส้ม-ดำ', 'น้ำเงิน-ดำ'],
      features: [
        'น้ำหนักเบา',
        'แรงบีบสูง',
        'ระบบหยุดไหลอัตโนมัติ',
        'ด้ามจับกระชับมือ'
      ],
      image: '/sealant-gun.jpg',
      rating: 4.9,
      reviews: 87,
      inStock: true,
    },
    {
      id: 'sealant-smoother',
      name: 'อุปกรณ์ปาดแต่งซีลแลนท์',
      description: 'อุปกรณ์ปาดแต่งซีลแลนท์ ช่วยให้งานซีลแลนท์เรียบร้อยสวยงาม มืออาชีพ',
      price: 120,
      colors: ['น้ำเงิน', 'แดง'],
      features: [
        'ทำจากพลาสติกคุณภาพสูง',
        'มีมุมปาดหลายแบบ',
        'ใช้งานง่าย',
        'ล้างทำความสะอาดได้'
      ],
      image: '/smoother.jpg',
      rating: 4.7,
      reviews: 42,
      inStock: true,
    },
    {
      id: 'trowel-set',
      name: 'ชุดเกรียงปาดกาว 4 ชิ้น',
      description: 'ชุดเกรียงสำหรับปาดกาวซีเมนต์ มีให้เลือกหลายขนาดฟัน เหมาะกับงานกระเบื้องทุกประเภท',
      price: 350,
      colors: ['เงิน'],
      features: [
        'ทำจากสแตนเลสคุณภาพสูง',
        'มีขนาดฟันให้เลือกหลายแบบ',
        'ด้ามจับแบบเออร์โกโนมิก',
        'ทนทาน ไม่เป็นสนิม'
      ],
      image: '/trowel-set.jpg',
      rating: 4.8,
      reviews: 36,
      inStock: true,
    },
    {
      id: 'primer',
      name: 'น้ำยาไพรเมอร์สำหรับซีลแลนท์',
      description: 'น้ำยาไพรเมอร์สำหรับเตรียมพื้นผิวก่อนการยาซีลแลนท์ เพิ่มประสิทธิภาพการยึดเกาะ',
      price: 280,
      colors: ['ใส'],
      features: [
        'เพิ่มแรงยึดเกาะ',
        'เหมาะกับพื้นผิวที่ยึดเกาะยาก',
        'แห้งเร็ว',
        'ใช้งานง่าย'
      ],
      image: '/primer.jpg',
      rating: 4.6,
      reviews: 29,
      inStock: true,
    },
    {
      id: 'caulk-remover',
      name: 'น้ำยาลอกซีลแลนท์',
      description: 'น้ำยาลอกซีลแลนท์เก่า ช่วยให้การซ่อมแซมและเปลี่ยนซีลแลนท์ทำได้ง่ายขึ้น',
      price: 190,
      colors: ['ใส'],
      features: [
        'ลอกซีลแลนท์เก่าออกได้ง่าย',
        'ไม่ทำลายพื้นผิว',
        'ประสิทธิภาพสูง',
        'ใช้งานง่าย'
      ],
      image: '/caulk-remover.jpg',
      rating: 4.5,
      reviews: 31,
      inStock: true,
    },
    {
      id: 'gloves-set',
      name: 'ถุงมือสำหรับงานซีลแลนท์ กันน้ำ',
      description: 'ถุงมือคุณภาพสูงสำหรับงานซีลแลนท์ กันน้ำ กันสารเคมี และป้องกันการระคายเคือง',
      price: 85,
      colors: ['น้ำเงิน', 'ดำ'],
      features: [
        'กันน้ำ 100%',
        'กันสารเคมี',
        'สวมใส่สบาย',
        'ทนทาน'
      ],
      image: '/gloves.jpg',
      rating: 4.4,
      reviews: 58,
      inStock: true,
    },
    {
      id: 'sealant-nozzle-set',
      name: 'ชุดหัวฉีดซีลแลนท์ 5 แบบ',
      description: 'ชุดหัวฉีดซีลแลนท์แบบพิเศษ มีให้เลือก 5 รูปแบบ สำหรับงานที่ต้องการความแม่นยำ',
      price: 120,
      colors: ['แดง', 'ดำ'],
      features: [
        'มีหัวฉีด 5 รูปแบบ',
        'ติดตั้งง่าย',
        'ใช้ได้กับหลอดซีลแลนท์มาตรฐาน',
        'ทำจากพลาสติกคุณภาพสูง'
      ],
      image: '/nozzle-set.jpg',
      rating: 4.6,
      reviews: 42,
      inStock: true,
    },
    {
      id: 'foam-tape',
      name: 'เทปโฟมสองหน้ารับแรงสูง',
      description: 'เทปโฟมสองหน้าคุณภาพสูง รับแรงได้มาก เหมาะสำหรับงานติดตั้งที่ต้องการความรวดเร็ว',
      price: 150,
      colors: ['เทา'],
      features: [
        'รับแรงได้สูง',
        'ยึดเกาะแน่น',
        'กันน้ำ',
        'ทนต่อสภาพอากาศ'
      ],
      image: '/foam-tape.jpg',
      rating: 4.7,
      reviews: 65,
      inStock: true,
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ส่วนหัว */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">อุปกรณ์เสริม (Accessories)</h1>
            <p className="text-gray-600 max-w-2xl">
              อุปกรณ์เสริมคุณภาพสูงสำหรับงานซีลแลนท์และกาว เพื่อการใช้งานที่สะดวกและมีประสิทธิภาพ ช่วยให้งานของคุณเสร็จอย่างรวดเร็วและสวยงาม
            </p>
          </div>
          <nav className="flex space-x-2 mt-4 md:mt-0 text-sm">
            <Link href="/products" className="text-gray-600 hover:text-primary">
              สินค้า
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">อุปกรณ์เสริม</span>
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
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท
                </label>
                <select 
                  id="type" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ทั้งหมด</option>
                  <option>อุปกรณ์ยิงและตกแต่ง</option>
                  <option>น้ำยาและสารเคมี</option>
                  <option>อุปกรณ์ป้องกัน</option>
                  <option>อุปกรณ์เสริมอื่นๆ</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <p className="text-sm text-gray-500">
                แสดง {accessoriesProducts.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {accessoriesProducts.map((product) => (
            <Link 
              key={product.id}
              href={`/products/accessories/${product.id}`}
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
      
      {/* คำแนะนำในการเลือกใช้อุปกรณ์ */}
      <div className="max-w-6xl mx-auto mt-16">
        <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
          <h2 className="text-2xl font-semibold text-primary mb-4">คำแนะนำในการเลือกใช้อุปกรณ์เสริม</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                การใช้อุปกรณ์เสริมที่เหมาะสมจะช่วยให้งานซีลแลนท์และกาวของคุณมีคุณภาพสูงขึ้น และทำงานได้รวดเร็วและสะดวกมากขึ้น
                อุปกรณ์คุณภาพดีอาจมีราคาแพงกว่า แต่จะช่วยลดเวลาและแรงงานในการทำงาน รวมทั้งช่วยให้ผลงานออกมาสวยงามและมีคุณภาพ
              </p>
              <p className="text-gray-700">
                ปืนยิงซีลแลนท์คุณภาพดีจะช่วยลดความเมื่อยล้าของมือและข้อมือ และให้แรงบีบที่สม่ำเสมอ ทำให้การยาซีลแลนท์เป็นเส้นที่สวยงาม
                นอกจากนี้ อุปกรณ์ตกแต่งและปาดแต่งยังช่วยให้รอยต่อของซีลแลนท์เรียบร้อยและดูเป็นมืออาชีพ
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">อุปกรณ์ที่แนะนำ</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-accent mr-2">☑</span>
                  <div>
                    <span className="font-medium">ปืนยิงซีลแลนท์ระดับมืออาชีพ</span>
                    <p className="text-sm text-gray-600 mt-1">ให้แรงบีบสม่ำเสมอ ลดความเมื่อยล้า เหมาะสำหรับงานขนาดใหญ่หรือการใช้งานต่อเนื่อง</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">☑</span>
                  <div>
                    <span className="font-medium">อุปกรณ์ปาดแต่งซีลแลนท์</span>
                    <p className="text-sm text-gray-600 mt-1">ช่วยให้รอยต่อซีลแลนท์เรียบร้อยสวยงาม มีมุมปาดหลายแบบให้เลือกใช้ตามลักษณะงาน</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">☑</span>
                  <div>
                    <span className="font-medium">น้ำยาไพรเมอร์</span>
                    <p className="text-sm text-gray-600 mt-1">จำเป็นสำหรับพื้นผิวที่ยึดเกาะยาก เช่น พลาสติกบางชนิด หรือพื้นผิวที่มีความพรุนสูง</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">☑</span>
                  <div>
                    <span className="font-medium">อุปกรณ์ป้องกัน</span>
                    <p className="text-sm text-gray-600 mt-1">ถุงมือและอุปกรณ์ป้องกันอื่นๆ ช่วยป้องกันการระคายเคืองจากสารเคมีและทำให้การทำความสะอาดง่ายขึ้น</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 