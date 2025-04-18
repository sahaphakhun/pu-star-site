'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductDetailPage() {
  // ข้อมูลสินค้า PU-40
  const product = {
    id: 'pu-sealant-40',
    name: 'PU-40 - โพลียูรีเทนซีลแลนท์',
    description: 'ซีลแลนท์โพลียูรีเทนคุณภาพสูง สำหรับงานยาแนวรอยต่อคอนกรีต โลหะ ไม้ และวัสดุก่อสร้างทั่วไป',
    longDescription: `PU-40 เป็นซีลแลนท์โพลียูรีเทนส่วนเดียว (One Component) คุณภาพสูง มีความยืดหยุ่นสูง ให้แรงยึดเกาะที่ดีกับวัสดุหลากหลายชนิด ทนต่อแสง UV และสภาพอากาศ เหมาะสำหรับงานยาแนวรอยต่อระหว่างวัสดุก่อสร้างทั่วไป เช่น คอนกรีต โลหะ ไม้ กระจก อลูมิเนียม และพลาสติกหลายชนิด
    
    ซีลแลนท์ PU-40 ให้การยึดเกาะที่แข็งแรงและทนทาน ยังคงความยืดหยุ่นแม้ในสภาพอากาศร้อนหรือเย็น ทำให้สามารถรองรับการขยายตัวและหดตัวของวัสดุได้ดี ป้องกันการรั่วซึมของน้ำและอากาศ เหมาะสำหรับใช้งานทั้งภายในและภายนอกอาคาร`,
    price: 280,
    discount: 0,
    colors: [
      { name: 'ขาว', code: 'white', selected: true },
      { name: 'เทา', code: 'gray', selected: false },
      { name: 'ดำ', code: 'black', selected: false },
    ],
    sizes: [
      { size: '300 ml.', price: 280, selected: true },
      { size: '600 ml.', price: 450, selected: false },
    ],
    features: [
      'ยืดหยุ่นสูง',
      'ทนต่อสภาพอากาศ',
      'ใช้ได้ทั้งภายในและภายนอก',
      'การยึดเกาะดีเยี่ยม',
      'ทาสีทับได้',
      'ทนต่อรังสี UV',
      'ป้องกันการรั่วซึม',
    ],
    specifications: [
      { name: 'ประเภท', value: 'โพลียูรีเทนซีลแลนท์ชนิดส่วนเดียว' },
      { name: 'สี', value: 'ขาว, เทา, ดำ' },
      { name: 'ความยืดหยุ่น', value: 'มากกว่า 250%' },
      { name: 'ระยะเวลาแห้งผิว', value: '90-120 นาที' },
      { name: 'ระยะเวลาแห้งสมบูรณ์', value: '24-48 ชั่วโมง' },
      { name: 'ความหนาแน่น', value: '1.3 g/cm³' },
      { name: 'ความแข็ง (Shore A)', value: '40±5' },
      { name: 'อุณหภูมิการใช้งาน', value: '-40°C ถึง +90°C' },
      { name: 'อายุการเก็บรักษา', value: '12 เดือนที่อุณหภูมิห้อง' },
    ],
    applications: [
      'รอยต่องานก่อสร้าง',
      'รอยต่อระหว่างพื้นและผนัง',
      'งานติดตั้งกระจกและอลูมิเนียม',
      'งานตกแต่งภายในและภายนอก',
      'งานที่ต้องการความทนต่อน้ำและสภาพอากาศ',
    ],
    images: [
      '/pu-40.jpg',
      '/pu-40-2.jpg',
      '/pu-40-3.jpg',
      '/pu-40-4.jpg',
    ],
    rating: 4.8,
    reviews: 156,
    stock: 85,
    sku: 'PU40-300ML-WHT',
    category: 'sealant',
    relatedProducts: [
      {
        id: 'pu-sealant-25',
        name: 'PU-25 - โพลียูรีเทนซีลแลนท์ ชนิดไหลตัวต่ำ',
        price: 250,
        image: '/pu-25.jpg',
      },
      {
        id: 'silicon-sealant-neutral',
        name: 'ซิลิโคนซีลแลนท์ สูตรกลาง',
        price: 220,
        image: '/silicon-neutral.jpg',
      },
      {
        id: 'hybrid-sealant',
        name: 'ไฮบริดซีลแลนท์',
        price: 350,
        image: '/hybrid.jpg',
      },
    ],
  };

  // State สำหรับจัดการข้อมูลและการแสดงผล
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedColor, setSelectedColor] = useState(product.colors.find(c => c.selected)?.name || product.colors[0].name);
  const [selectedSize, setSelectedSize] = useState(product.sizes.find(s => s.selected)?.size || product.sizes[0].size);
  const [currentImage, setCurrentImage] = useState(0);
  
  // คำนวณราคา
  const selectedSizeObject = product.sizes.find(s => s.size === selectedSize) || product.sizes[0];
  const price = selectedSizeObject.price;
  const finalPrice = product.discount ? price - (price * product.discount / 100) : price;
  
  // ฟังก์ชันเพิ่ม/ลดจำนวน
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  
  // ฟังก์ชันเพิ่มลงตะกร้า
  const addToCart = () => {
    // ในตัวอย่างนี้จะแสดง alert ก่อน ในระบบจริงควรมีการบันทึกข้อมูลลงใน state หรือส่งไปยัง API
    alert(`เพิ่ม ${product.name} สี${selectedColor} ขนาด${selectedSize} จำนวน ${quantity} ชิ้น ลงในตะกร้าแล้ว`);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* เส้นทางการนำทาง (Breadcrumb) */}
      <div className="max-w-7xl mx-auto mb-6">
        <nav className="flex text-sm">
          <Link href="/" className="text-gray-600 hover:text-primary">
            หน้าหลัก
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products" className="text-gray-600 hover:text-primary">
            สินค้า
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products/sealant" className="text-gray-600 hover:text-primary">
            ซีลแลนท์
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-primary font-medium">{product.name}</span>
        </nav>
      </div>
      
      {/* ส่วนหลักแสดงรายละเอียดสินค้า */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* คอลัมน์ซ้าย - รูปภาพ */}
          <div>
            {/* รูปภาพหลัก */}
            <div className="relative h-96 mb-4 bg-white border border-primary/10 rounded-lg overflow-hidden">
              <Image 
                src={product.images[currentImage]} 
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            
            {/* รูปภาพขนาดเล็ก */}
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`relative w-20 h-20 border-2 rounded-md overflow-hidden cursor-pointer transition
                    ${currentImage === index ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => setCurrentImage(index)}
                >
                  <Image 
                    src={image}
                    alt={`${product.name} - ภาพที่ ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* คอลัมน์ขวา - ข้อมูลสินค้า */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-primary mb-2">{product.name}</h1>
            
            {/* คะแนนและรีวิว */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                <span className="text-amber-400">★★★★★</span>
                <span className="ml-1 text-gray-700">{product.rating}</span>
              </div>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500">{product.reviews} รีวิว</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500">ขายแล้ว 1,350+ ชิ้น</span>
            </div>
            
            {/* ราคา */}
            <div className="mb-6">
              {product.discount > 0 && (
                <span className="inline-block mr-2 text-gray-500 line-through">
                  {price} บาท
                </span>
              )}
              <span className="text-3xl font-bold text-accent">
                {finalPrice} บาท
              </span>
              {product.discount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-md text-sm">
                  ลด {product.discount}%
                </span>
              )}
            </div>
            
            {/* รายละเอียดย่อ */}
            <p className="text-gray-700 mb-6">
              {product.description}
            </p>
            
            {/* เลือกสี */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-2">สี</h3>
              <div className="flex space-x-2">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`px-4 py-2 border rounded-md transition
                      ${selectedColor === color.name 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-300 hover:border-primary/50'
                      }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* เลือกขนาด */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-2">ขนาด</h3>
              <div className="flex space-x-2">
                {product.sizes.map(size => (
                  <button
                    key={size.size}
                    onClick={() => setSelectedSize(size.size)}
                    className={`px-4 py-2 border rounded-md transition
                      ${selectedSize === size.size 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-300 hover:border-primary/50'
                      }`}
                  >
                    {size.size} - {size.price} บาท
                  </button>
                ))}
              </div>
            </div>
            
            {/* จำนวน */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-2">จำนวน</h3>
              <div className="flex items-center">
                <button 
                  onClick={decreaseQuantity}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md hover:bg-gray-100"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= product.stock) {
                      setQuantity(value);
                    }
                  }}
                  className="w-16 h-10 border-t border-b border-gray-300 text-center"
                />
                <button 
                  onClick={increaseQuantity}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md hover:bg-gray-100"
                >
                  +
                </button>
                <span className="ml-4 text-gray-500">มีสินค้า {product.stock} ชิ้น</span>
              </div>
            </div>
            
            {/* ปุ่มดำเนินการ */}
            <div className="flex space-x-4 mb-8">
              <button 
                onClick={addToCart}
                className="flex-1 px-6 py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
              >
                เพิ่มลงตะกร้า
              </button>
              <button className="flex-1 px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors">
                ซื้อทันที
              </button>
            </div>
            
            {/* ข้อมูลเพิ่มเติม */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex space-x-2">
                  <span className="text-gray-500">รหัสสินค้า:</span>
                  <span>{product.sku}</span>
                </div>
                <div className="flex space-x-2">
                  <span className="text-gray-500">หมวดหมู่:</span>
                  <Link href="/products/sealant" className="text-primary hover:underline">
                    ซีลแลนท์
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* แท็บข้อมูลเพิ่มเติม */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 font-medium relative
                  ${activeTab === 'description' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                รายละเอียดสินค้า
                {activeTab === 'description' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`py-4 font-medium relative
                  ${activeTab === 'specifications' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                ข้อมูลจำเพาะ
                {activeTab === 'specifications' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 font-medium relative
                  ${activeTab === 'applications' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                การใช้งาน
                {activeTab === 'applications' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
            </nav>
          </div>
          
          <div className="py-8">
            {/* รายละเอียดสินค้า */}
            {activeTab === 'description' && (
              <div className="space-y-6">
                <p className="text-gray-700 whitespace-pre-line">{product.longDescription}</p>
                
                <h3 className="text-xl font-semibold text-primary mt-8 mb-4">คุณสมบัติเด่น</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* ข้อมูลจำเพาะ */}
            {activeTab === 'specifications' && (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <tbody>
                    {product.specifications.map((spec, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 border-b border-gray-200 font-medium text-gray-700 w-1/3">
                          {spec.name}
                        </td>
                        <td className="px-6 py-4 border-b border-gray-200 text-gray-700">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* การใช้งาน */}
            {activeTab === 'applications' && (
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">การใช้งาน</h3>
                <ul className="space-y-3">
                  {product.applications.map((application, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent mr-3 font-bold">•</span>
                      <span className="text-gray-700">{application}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-amber-800 font-semibold mb-2">คำแนะนำการใช้งาน</h4>
                  <p className="text-amber-700 text-sm">
                    ทำความสะอาดพื้นผิวให้ปราศจากฝุ่น น้ำมัน และสิ่งสกปรกต่างๆ ก่อนการใช้งาน
                    สำหรับพื้นผิวที่มีความพรุนมาก แนะนำให้ใช้ไพรเมอร์ก่อนการยาซีลแลนท์
                    ตัดปลายหลอดให้เป็นมุม 45 องศา และใช้ปืนยิงซีลแลนท์เพื่อความสะดวก
                    หลังการใช้งาน ให้ปิดฝาให้สนิทและเก็บในที่แห้งและเย็น
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* สินค้าที่เกี่ยวข้อง */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-primary mb-6">สินค้าที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct.id}
                href={`/products/sealant/${relatedProduct.id}`}
                className="group block bg-white rounded-lg shadow overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 border border-primary/10"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image 
                    src={relatedProduct.image} 
                    alt={relatedProduct.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2">{relatedProduct.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-accent">{relatedProduct.price} บาท</span>
                    <span className="inline-block px-3 py-1 bg-accent text-white rounded-md text-sm transition-colors hover:bg-accent/90">
                      ดูรายละเอียด
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 