"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// mock ข้อมูลสินค้า
const products = [
  {
    id: 1,
    name: "PU Sealant 600ml",
    price: 250,
    image: "/blog-sealant.jpg",
    category: "Sealant",
  },
  {
    id: 2,
    name: "Silicone Sealant 300ml",
    price: 120,
    image: "/blog-sealant.jpg",
    category: "Sealant",
  },
  {
    id: 3,
    name: "Construction Adhesive 400ml",
    price: 180,
    image: "/blog-adhesive.jpg",
    category: "Adhesive",
  },
  {
    id: 4,
    name: "Acrylic Sealant 280ml",
    price: 90,
    image: "/blog-sealant.jpg",
    category: "Sealant",
  },
];

const categories = ["Sealant", "Adhesive"];

export default function Home() {
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const addToCart = (id: number) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prev, { id, qty: 1 }];
      }
    });
  };

  // หาจำนวนรวมในตะกร้า
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // ฟิลเตอร์สินค้า
  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Floating Cart */}
      <div className="fixed top-6 right-6 z-50">
        <Link href="/cart" className="relative flex items-center gap-2 bg-white shadow-lg rounded-full px-5 py-2 border border-primary/20 hover:shadow-xl transition">
          <span className="material-symbols-outlined text-primary">shopping_cart</span>
          <span className="font-semibold text-primary">ตะกร้า</span>
          <span className="bg-accent text-white rounded-full px-2 py-0.5 text-xs font-bold ml-1">{cartCount}</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-primary/90 to-accent/80 py-16 px-4 text-center rounded-b-3xl shadow-lg mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">PU STAR SHOP</h1>
        <p className="text-lg sm:text-2xl text-white/90 mb-6 max-w-2xl mx-auto">แหล่งรวมซีลแลนท์และกาวคุณภาพสูงสำหรับงานก่อสร้างและอุตสาหกรรม จัดส่งทั่วประเทศ</p>
        <a href="#products" className="inline-block bg-white text-primary font-bold px-8 py-3 rounded-full shadow hover:bg-accent hover:text-white transition">เลือกซื้อสินค้า</a>
      </section>

      <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto px-4">
        {/* Sidebar Filter */}
        <aside className="md:w-64 w-full md:sticky top-32 h-fit bg-white rounded-xl shadow p-6 mb-6 md:mb-0">
          <h2 className="font-bold text-lg mb-4 text-primary">ค้นหาสินค้า</h2>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-primary/20 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="mb-2 font-semibold text-primary">หมวดหมู่</div>
          <div className="flex flex-col gap-2">
            <button
              className={`text-left px-3 py-2 rounded transition ${selectedCategory === null ? "bg-accent text-white" : "hover:bg-primary/10"}`}
              onClick={() => setSelectedCategory(null)}
            >
              ทั้งหมด
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`text-left px-3 py-2 rounded transition ${selectedCategory === cat ? "bg-accent text-white" : "hover:bg-primary/10"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1" id="products">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">สินค้า</h2>
            <span className="text-gray-500 text-sm">{filteredProducts.length} รายการ</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-16">ไม่พบสินค้าที่ค้นหา</div>
            )}
            {filteredProducts.map((product) => {
              const imageUrl = product.image && product.image.trim() !== "" ? product.image : "https://placehold.co/400x300?text=No+Image";
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 border border-primary/10 hover:shadow-xl hover:-translate-y-1 transition group relative"
                >
                  <div className="relative w-full h-44 mb-2 overflow-hidden rounded-lg">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <h3 className="font-bold text-primary text-lg line-clamp-2 min-h-[48px]">{product.name}</h3>
                  <div className="text-accent font-semibold text-xl">฿{product.price.toLocaleString()}</div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/products/${product.id}`}
                      className="bg-primary text-white rounded px-4 py-2 text-center hover:bg-primary/80 transition flex-1"
                    >
                      ดูรายละเอียด
                    </Link>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="bg-accent text-white rounded px-4 py-2 text-center hover:bg-accent/80 transition flex-1 font-semibold shadow"
                    >
                      หยิบใส่ตะกร้า
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
} 