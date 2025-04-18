import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'สินค้าทั้งหมด | PU STAR THAILAND',
  description: 'ผลิตภัณฑ์ซีลแลนท์และกาวคุณภาพสูงจาก PU STAR สำหรับงานก่อสร้างและตกแต่งภายใน',
}

export default function AllProductsPage() {
  // กำหนดข้อมูลสินค้าทั้งหมด แยกตามหมวดหมู่
  const categories = [
    {
      id: 'sealant',
      name: 'ซีลแลนท์ (Sealant)',
      description: 'ผลิตภัณฑ์ซีลแลนท์คุณภาพสูงสำหรับงานก่อสร้างและตกแต่งภายใน',
      products: [
        {
          id: 'pu-sealant-40',
          name: 'PU-40 - โพลียูรีเทนซีลแลนท์',
          description: 'ซีลแลนท์โพลียูรีเทนคุณภาพสูง สำหรับงานยาแนวรอยต่อคอนกรีต โลหะ ไม้ และวัสดุก่อสร้างทั่วไป',
          price: 280,
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
          image: '/acrylic.jpg',
          rating: 4.5,
          reviews: 62,
          inStock: true,
        },
      ],
    },
    {
      id: 'adhesive',
      name: 'กาว (Adhesive)',
      description: 'กาวสำหรับงานก่อสร้างที่มีประสิทธิภาพสูง ยึดเกาะแน่น ทนต่อแรงดึงและสภาพแวดล้อมต่างๆ',
      products: [
        {
          id: 'construction-adhesive',
          name: 'กาวก่อสร้างอเนกประสงค์',
          description: 'กาวก่อสร้างอเนกประสงค์ แรงยึดติดสูง ใช้ได้กับวัสดุหลากหลาย ทั้งงานภายในและภายนอก',
          price: 320,
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
          image: '/tile-adhesive.jpg',
          rating: 4.8,
          reviews: 65,
          inStock: true,
        },
      ],
    },
    {
      id: 'accessories',
      name: 'อุปกรณ์เสริม (Accessories)',
      description: 'อุปกรณ์เสริมสำหรับงานซีลแลนท์และกาว เพื่อการใช้งานที่สะดวกและมีประสิทธิภาพ',
      products: [
        {
          id: 'sealant-gun',
          name: 'ปืนยิงซีลแลนท์ระดับมืออาชีพ',
          description: 'ปืนยิงซีลแลนท์คุณภาพสูง ออกแบบสำหรับมืออาชีพ ใช้งานง่าย ลดความเมื่อยล้า',
          price: 450,
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
          image: '/primer.jpg',
          rating: 4.6,
          reviews: 29,
          inStock: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ส่วนหัว */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">สินค้าทั้งหมด</h1>
            <p className="text-gray-600 max-w-2xl">
              ผลิตภัณฑ์คุณภาพสูงจาก PU STAR ตอบโจทย์ทุกงานก่อสร้างและตกแต่ง ด้วยมาตรฐานระดับสากล
            </p>
          </div>
          <nav className="flex space-x-2 mt-4 md:mt-0 text-sm">
            <Link href="/products" className="text-gray-600 hover:text-primary">
              สินค้า
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">สินค้าทั้งหมด</span>
          </nav>
        </div>
        
        {/* ตัวกรองและจัดเรียง */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary/10 mb-10">
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <select 
                  id="category" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ทั้งหมด</option>
                  <option>ซีลแลนท์</option>
                  <option>กาว</option>
                  <option>อุปกรณ์เสริม</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  ช่วงราคา
                </label>
                <select 
                  id="price" 
                  className="min-w-[150px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>ทั้งหมด</option>
                  <option>ต่ำกว่า 200 บาท</option>
                  <option>200 - 300 บาท</option>
                  <option>300 - 500 บาท</option>
                  <option>มากกว่า 500 บาท</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                กรอง
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* แสดงสินค้าแยกตามหมวดหมู่ */}
      <div className="max-w-7xl mx-auto">
        {categories.map((category) => (
          <div key={category.id} className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary">{category.name}</h2>
              <Link href={`/products/${category.id}`} className="text-accent hover:underline font-medium">
                ดูสินค้าทั้งหมดในหมวด
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.products.map((product) => (
                <Link 
                  key={product.id}
                  href={`/products/${category.id}/${product.id}`}
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
        ))}
      </div>
      
      {/* ส่วนคำแนะนำการเลือกสินค้า */}
      <div className="max-w-7xl mx-auto mt-10 mb-8">
        <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
          <h2 className="text-2xl font-semibold text-primary mb-4">คำแนะนำในการเลือกซื้อสินค้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                การเลือกซื้อผลิตภัณฑ์ซีลแลนท์และกาวที่เหมาะสมกับงานเป็นสิ่งสำคัญ ที่จะช่วยให้งานก่อสร้างและตกแต่งของคุณมีคุณภาพและความทนทาน
                คุณควรพิจารณาปัจจัยต่างๆ เช่น ประเภทของวัสดุที่ต้องการยึดติด สภาพแวดล้อมในการใช้งาน และข้อกำหนดเฉพาะของงาน
              </p>
              <p className="text-gray-700">
                หากคุณไม่แน่ใจว่าควรเลือกใช้ผลิตภัณฑ์ใด สามารถติดต่อทีมงานฝ่ายเทคนิคของเราเพื่อขอคำแนะนำได้ตลอดเวลา
                เรายินดีให้คำปรึกษาเพื่อให้คุณได้ผลิตภัณฑ์ที่เหมาะสมที่สุดสำหรับงานของคุณ
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">สิ่งที่ควรพิจารณา</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-accent mr-2">●</span>
                  <span className="text-gray-700">ประเภทของวัสดุที่ต้องการยึดติด (ไม้, โลหะ, กระจก, คอนกรีต ฯลฯ)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">●</span>
                  <span className="text-gray-700">สภาพแวดล้อมในการใช้งาน (ภายใน/ภายนอก, เปียกชื้น, อุณหภูมิสูง/ต่ำ)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">●</span>
                  <span className="text-gray-700">ความยืดหยุ่นที่ต้องการ (ยืดหยุ่นสูง/ต่ำ, แข็งตัว)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">●</span>
                  <span className="text-gray-700">ระยะเวลาในการแห้งตัวและการใช้งาน</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">●</span>
                  <span className="text-gray-700">ความต้องการพิเศษ (ทนไฟ, ทนสารเคมี, ปลอดภัยต่อสิ่งแวดล้อม)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 