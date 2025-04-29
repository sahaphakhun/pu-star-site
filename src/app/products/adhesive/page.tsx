import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'กาว | Next Star Innovation THAILAND',
  description: 'ผลิตภัณฑ์กาวคุณภาพสูงจาก Next Star Innovation สำหรับงานก่อสร้างและตกแต่งภายใน',
}

export default function AdhesivePage() {
  // ข้อมูลสินค้าประเภทกาว
  const adhesiveProducts = [
    {
      id: 'construction-adhesive',
      name: 'กาวก่อสร้างอเนกประสงค์',
      description: 'กาวก่อสร้างอเนกประสงค์ แรงยึดติดสูง ใช้ได้กับวัสดุหลากหลาย ทั้งงานภายในและภายนอก',
      price: 320,
      colors: ['เบจ'],
      features: [
        'ยึดเกาะแน่นสูง',
        'ใช้ได้กับวัสดุหลากหลาย',
        'ทนทานต่อสภาพอากาศ',
        'ใช้ได้ทั้งภายในและภายนอก'
      ],
      image: '/construction-adhesive.jpg',
      rating: 4.7,
      reviews: 98,
      inStock: true,
    },
    {
      id: 'epoxy-adhesive',
      name: 'กาวอีพ็อกซี่ 2 ส่วน',
      description: 'กาวอีพ็อกซี่สองส่วนผสม ให้แรงยึดติดที่แข็งแรงสูงมาก เหมาะสำหรับงานที่ต้องการความแข็งแรงเป็นพิเศษ',
      price: 390,
      colors: ['ใส'],
      features: [
        'แรงยึดติดสูงมาก',
        'ทนทานต่อแรงกระแทก',
        'ทนทานต่อสารเคมี',
        'แข็งแรงเหมือนโลหะ'
      ],
      image: '/epoxy.jpg',
      rating: 4.9,
      reviews: 72,
      inStock: true,
    },
    {
      id: 'spray-adhesive',
      name: 'กาวสเปรย์สำหรับงานอุตสาหกรรม',
      description: 'กาวสเปรย์สำหรับงานติดวัสดุที่มีพื้นผิวขนาดใหญ่ ให้การยึดเกาะที่สม่ำเสมอ',
      price: 450,
      colors: ['ใส'],
      features: [
        'ใช้งานง่ายด้วยระบบสเปรย์',
        'ยึดเกาะสม่ำเสมอทั่วพื้นผิว',
        'แห้งเร็ว',
        'เหมาะกับงานพื้นที่ขนาดใหญ่'
      ],
      image: '/spray-adhesive.jpg',
      rating: 4.6,
      reviews: 43,
      inStock: true,
    },
    {
      id: 'tile-adhesive',
      name: 'กาวซีเมนต์สำหรับปูกระเบื้อง',
      description: 'กาวซีเมนต์สำหรับปูกระเบื้องโดยเฉพาะ ยึดเกาะแน่น ทนต่อความชื้นและรับน้ำหนักได้ดี',
      price: 280,
      colors: ['เทา'],
      features: [
        'ยึดเกาะกระเบื้องทุกประเภท',
        'ทนต่อความชื้นสูง',
        'รับน้ำหนักได้ดี',
        'ป้องกันการแตกร้าว'
      ],
      image: '/tile-adhesive.jpg',
      rating: 4.8,
      reviews: 65,
      inStock: true,
    },
    {
      id: 'pu-adhesive',
      name: 'กาวโพลียูรีเทนสำหรับงานไม้',
      description: 'กาวโพลียูรีเทนคุณภาพสูงสำหรับงานไม้ ให้การยึดเกาะที่แข็งแรง ทนน้ำ เหมาะสำหรับงานภายนอก',
      price: 350,
      colors: ['เหลืองอำพัน'],
      features: [
        'ทนน้ำ 100%',
        'แรงยึดติดสูง',
        'เหมาะสำหรับงานไม้ทุกชนิด',
        'ทนทานต่อสภาพอากาศ'
      ],
      image: '/pu-wood-adhesive.jpg',
      rating: 4.8,
      reviews: 87,
      inStock: true,
    },
    {
      id: 'contact-adhesive',
      name: 'กาวติดแน่นอเนกประสงค์',
      description: 'กาวติดแน่นอเนกประสงค์ แห้งเร็ว ใช้ได้กับวัสดุหลายชนิด เช่น ไม้ พลาสติก ยาง โลหะ',
      price: 220,
      colors: ['เหลือง'],
      features: [
        'แห้งเร็ว',
        'ยึดติดแน่นทันที',
        'อเนกประสงค์',
        'ใช้งานง่าย'
      ],
      image: '/contact-adhesive.jpg',
      rating: 4.5,
      reviews: 56,
      inStock: true,
    },
    {
      id: 'hotmelt-adhesive',
      name: 'กาวร้อนอุตสาหกรรม',
      description: 'กาวร้อนสำหรับงานอุตสาหกรรม เหมาะกับวัสดุหลากหลาย ยึดติดเร็ว แข็งแรง',
      price: 420,
      colors: ['ใส', 'เหลือง'],
      features: [
        'ยึดติดเร็วภายใน 10 วินาที',
        'แรงยึดติดสูง',
        'ทนความร้อนสูง',
        'เหมาะกับงานอุตสาหกรรม'
      ],
      image: '/hotmelt-adhesive.jpg',
      rating: 4.7,
      reviews: 38,
      inStock: true,
    },
    {
      id: 'acrylic-adhesive',
      name: 'กาวอะคริลิคสำหรับงานตกแต่ง',
      description: 'กาวอะคริลิคสำหรับงานตกแต่งภายใน ปลอดภัย ไร้กลิ่น ไม่มีสารระเหย เหมาะสำหรับห้องนอนหรือห้องเด็ก',
      price: 240,
      colors: ['ขาว'],
      features: [
        'ปลอดภัย ไร้สารพิษ',
        'ไม่มีกลิ่น',
        'ล้างออกด้วยน้ำได้',
        'เป็นมิตรกับสิ่งแวดล้อม'
      ],
      image: '/acrylic-adhesive.jpg',
      rating: 4.5,
      reviews: 47,
      inStock: true,
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ส่วนหัว */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">กาว (Adhesive)</h1>
            <p className="text-gray-600 max-w-2xl">
              ผลิตภัณฑ์กาวคุณภาพสูงสำหรับงานก่อสร้างและตกแต่ง ให้แรงยึดติดที่แข็งแรง ทนทาน เหมาะกับวัสดุหลากหลายชนิด
            </p>
          </div>
          <nav className="flex space-x-2 mt-4 md:mt-0 text-sm">
            <Link href="/products" className="text-gray-600 hover:text-primary">
              สินค้า
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">กาว</span>
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
                <label htmlFor="application" className="block text-sm font-medium text-gray-700 mb-1">
                  การใช้งาน
                </label>
                <select 
                  id="application" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ทั้งหมด</option>
                  <option>งานไม้</option>
                  <option>งานกระเบื้อง</option>
                  <option>งานโลหะ</option>
                  <option>งานตกแต่ง</option>
                  <option>งานอุตสาหกรรม</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <p className="text-sm text-gray-500">
                แสดง {adhesiveProducts.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adhesiveProducts.map((product) => (
            <Link 
              key={product.id}
              href={`/products/adhesive/${product.id}`}
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
      
      {/* ข้อมูลเกี่ยวกับกาว */}
      <div className="max-w-6xl mx-auto mt-16">
        <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
          <h2 className="text-2xl font-semibold text-primary mb-4">คำแนะนำการเลือกกาว</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                การเลือกกาวที่เหมาะสมกับงานเป็นสิ่งสำคัญที่จะช่วยให้งานของคุณมีความแข็งแรงและทนทาน
                ปัจจัยที่ควรพิจารณาเมื่อเลือกกาว ได้แก่ ประเภทของวัสดุที่ต้องการยึดติด สภาพแวดล้อมในการใช้งาน และแรงยึดติดที่ต้องการ
              </p>
              <p className="text-gray-700">
                กาวแต่ละประเภทมีคุณสมบัติและข้อดีที่แตกต่างกัน เช่น กาวอีพ็อกซี่ให้แรงยึดติดที่แข็งแรงมาก
                แต่มีความยืดหยุ่นน้อย ในขณะที่กาวโพลียูรีเทนให้ทั้งแรงยึดติดที่ดีและความยืดหยุ่น เหมาะกับงานที่ต้องรับแรงกระแทกหรือมีการเคลื่อนตัว
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">ประเภทของกาว</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700"><span className="font-medium">กาวโพลียูรีเทน:</span> เหมาะกับงานไม้ที่ต้องการความทนน้ำและสภาพอากาศ</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700"><span className="font-medium">กาวอีพ็อกซี่:</span> เหมาะกับงานที่ต้องการความแข็งแรงสูงมาก เช่น โลหะ และงานซ่อมแซม</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700"><span className="font-medium">กาวซีเมนต์:</span> เหมาะสำหรับงานกระเบื้องและวัสดุก่อสร้าง</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700"><span className="font-medium">กาวอะคริลิค:</span> เหมาะสำหรับงานตกแต่งภายในที่ต้องการความปลอดภัยและไร้กลิ่น</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  <span className="text-gray-700"><span className="font-medium">กาวร้อน:</span> เหมาะสำหรับงานที่ต้องการความรวดเร็วในการยึดติด</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 