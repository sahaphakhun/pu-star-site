import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'สินค้า | PU STAR THAILAND',
  description: 'ผลิตภัณฑ์ซีลแลนท์และกาวคุณภาพสูงจาก PU STAR สำหรับงานก่อสร้างและตกแต่งภายใน',
}

export default function ProductsPage() {
  // หมวดหมู่สินค้าหลัก
  const categories = [
    {
      id: 'sealant',
      name: 'ซีลแลนท์ (Sealant)',
      description: 'ผลิตภัณฑ์ซีลแลนท์คุณภาพสูงสำหรับงานก่อสร้างและตกแต่งภายใน ป้องกันการรั่วซึมและทนทานต่อสภาพอากาศ',
      image: '/sealant.jpg',
    },
    {
      id: 'adhesive',
      name: 'กาว (Adhesive)',
      description: 'กาวสำหรับงานก่อสร้างที่มีประสิทธิภาพสูง ยึดเกาะแน่น ทนต่อแรงดึงและสภาพแวดล้อมต่างๆ',
      image: '/adhesive.jpg',
    },
    {
      id: 'accessories',
      name: 'อุปกรณ์เสริม (Accessories)',
      description: 'อุปกรณ์เสริมสำหรับงานซีลแลนท์และกาว เพื่อการใช้งานที่สะดวกและมีประสิทธิภาพ',
      image: '/accessories.jpg',
    },
  ];
  
  // สินค้าแนะนำ
  const featuredProducts = [
    {
      id: 'pu-sealant-40',
      name: 'PU-40 - โพลียูรีเทนซีลแลนท์',
      description: 'ซีลแลนท์โพลียูรีเทนคุณภาพสูง สำหรับงานยาแนวรอยต่อคอนกรีต โลหะ ไม้ และวัสดุก่อสร้างทั่วไป',
      price: 280,
      category: 'sealant',
      image: '/pu-40.jpg',
    },
    {
      id: 'silicon-sealant-neutral',
      name: 'ซิลิโคนซีลแลนท์ สูตรกลาง',
      description: 'ซิลิโคนซีลแลนท์สูตรกลาง ไม่กัดกร่อนพื้นผิว เหมาะสำหรับงานกระจก อลูมิเนียม และวัสดุที่ไวต่อการกัดกร่อน',
      price: 220,
      category: 'sealant',
      image: '/silicon-neutral.jpg',
    },
    {
      id: 'construction-adhesive',
      name: 'กาวก่อสร้างอเนกประสงค์',
      description: 'กาวก่อสร้างอเนกประสงค์ แรงยึดติดสูง ใช้ได้กับวัสดุหลากหลาย ทั้งงานภายในและภายนอก',
      price: 320,
      category: 'adhesive',
      image: '/construction-adhesive.jpg',
    },
    {
      id: 'sealant-gun',
      name: 'ปืนยิงซีลแลนท์ระดับมืออาชีพ',
      description: 'ปืนยิงซีลแลนท์คุณภาพสูง ออกแบบสำหรับมืออาชีพ ใช้งานง่าย ลดความเมื่อยล้า',
      price: 450,
      category: 'accessories',
      image: '/sealant-gun.jpg',
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ส่วนหัว */}
      <section className="max-w-6xl mx-auto mb-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">ผลิตภัณฑ์คุณภาพจาก PU STAR</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ผลิตภัณฑ์คุณภาพสูงสำหรับงานก่อสร้างและตกแต่ง ด้วยเทคโนโลยีที่ทันสมัยและมาตรฐานระดับสากล
          </p>
        </div>
        
        {/* แบนเนอร์หมวดหมู่หลัก */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/products/${category.id}`}
              className="group block bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 border border-primary/10"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src={category.image} 
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-primary mb-2">{category.name}</h2>
                <p className="text-gray-600 text-sm">{category.description}</p>
                <div className="mt-4">
                  <span className="inline-block px-4 py-2 bg-accent text-white rounded-md font-medium transition-colors hover:bg-accent/90">
                    ดูสินค้าทั้งหมด
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* สินค้าแนะนำ */}
      <section className="max-w-6xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-primary">สินค้าแนะนำ</h2>
          <Link href="/products/all" className="text-accent hover:underline font-medium">
            ดูสินค้าทั้งหมด
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link 
              key={product.id}
              href={`/products/${product.category}/${product.id}`}
              className="group block bg-white rounded-lg shadow overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 border border-primary/10"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                    {categories.find(cat => cat.id === product.category)?.name}
                  </span>
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
      </section>

      {/* วิธีการสั่งซื้อ */}
      <section className="max-w-6xl mx-auto mb-10 bg-primary/5 rounded-lg p-6 border border-primary/20">
        <h2 className="text-2xl font-semibold text-primary mb-4">วิธีการสั่งซื้อสินค้า</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">เลือกสินค้า</h3>
            <p className="text-gray-600">เลือกสินค้าที่ต้องการและระบุจำนวน จากนั้นเพิ่มลงในตะกร้า</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">ชำระเงิน</h3>
            <p className="text-gray-600">เลือกวิธีการชำระเงิน โอนผ่านธนาคาร บัตรเครดิต หรือ QR พร้อมเพย์</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">รับสินค้า</h3>
            <p className="text-gray-600">เราจัดส่งสินค้าถึงบ้านคุณผ่านบริการขนส่งที่เชื่อถือได้ ติดตามสถานะได้ตลอดเวลา</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link 
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-white rounded-md font-medium transition-colors hover:bg-primary/90"
          >
            ติดต่อฝ่ายขาย
          </Link>
        </div>
      </section>

      {/* สิทธิประโยชน์ */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-primary mb-6 text-center">ทำไมต้องเลือกสินค้าจาก PU STAR</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow border border-primary/10">
            <div className="mb-3 text-accent text-3xl">✓</div>
            <h3 className="text-lg font-semibold text-primary mb-2">คุณภาพระดับสากล</h3>
            <p className="text-gray-600 text-sm">ผลิตภัณฑ์ทุกชิ้นผ่านการรับรองมาตรฐานระดับสากล ISO 9001 และมาตรฐานอุตสาหกรรม</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-primary/10">
            <div className="mb-3 text-accent text-3xl">✓</div>
            <h3 className="text-lg font-semibold text-primary mb-2">นวัตกรรมล้ำสมัย</h3>
            <p className="text-gray-600 text-sm">ผลิตภัณฑ์ของเราผ่านการวิจัยและพัฒนาจากทีมผู้เชี่ยวชาญกว่า 100 คนที่มีประสบการณ์สูง</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-primary/10">
            <div className="mb-3 text-accent text-3xl">✓</div>
            <h3 className="text-lg font-semibold text-primary mb-2">การันตีคุณภาพ</h3>
            <p className="text-gray-600 text-sm">รับประกันสินค้าทุกชิ้น หากพบปัญหาจากการผลิต เรายินดีเปลี่ยนสินค้าให้ใหม่ทันที</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-primary/10">
            <div className="mb-3 text-accent text-3xl">✓</div>
            <h3 className="text-lg font-semibold text-primary mb-2">บริการหลังการขาย</h3>
            <p className="text-gray-600 text-sm">ทีมงานฝ่ายเทคนิคพร้อมให้คำปรึกษาและแก้ไขปัญหาตลอด 24 ชั่วโมง</p>
          </div>
        </div>
      </section>
    </div>
  );
} 