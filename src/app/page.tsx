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
    image: "/product-pu-sealant.jpg",
  },
  {
    id: 2,
    name: "Silicone Sealant 300ml",
    price: 120,
    image: "",
  },
  {
    id: 3,
    name: "Construction Adhesive 400ml",
    price: 180,
    image: "/product-adhesive.jpg",
  },
  {
    id: 4,
    name: "Acrylic Sealant 280ml",
    price: 90,
    image: "",
  },
];

export default function Home() {
  const [cart, setCart] = useState<{id: number, qty: number}[]>([]);

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

  return (
    <div className="flex flex-col gap-10 p-8 max-w-5xl mx-auto">
      {/* แถวที่ 1: หัวข้อเลือกซื้อสินค้า */}
      <section className="flex flex-col items-center justify-center text-center gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-accent">เลือกซื้อสินค้า</span> <span className="text-primary">PU STAR</span>
        </h1>
        <p className="text-lg text-gray-700 max-w-xl">เลือกชมและสั่งซื้อผลิตภัณฑ์ซีลแลนท์และกาวคุณภาพสูงจากเรา</p>
        <div className="mt-2 text-primary font-semibold">สินค้าในตะกร้า: {cartCount} ชิ้น</div>
      </section>

      {/* แถวที่ 2: แสดงสินค้าแบบ grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const imageUrl = product.image && product.image.trim() !== "" ? product.image : "https://placehold.co/400x300?text=No+Image";
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 border border-primary/10 hover:shadow-lg transition"
              >
                <div className="relative w-full h-40 mb-2">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <h3 className="font-bold text-primary text-lg">{product.name}</h3>
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
                    className="bg-accent text-white rounded px-4 py-2 text-center hover:bg-accent/80 transition flex-1"
                  >
                    หยิบใส่ตะกร้า
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
