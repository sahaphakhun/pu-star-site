"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

// mock ข้อมูลสินค้า (ควรย้ายไป global หรือ context จริงจัง)
const products = [
  { id: 1, name: "PU Sealant 600ml", price: 250, image: "/blog-sealant.jpg", category: "Sealant" },
  { id: 2, name: "Silicone Sealant 300ml", price: 120, image: "/blog-sealant.jpg", category: "Sealant" },
  { id: 3, name: "Construction Adhesive 400ml", price: 180, image: "/blog-adhesive.jpg", category: "Adhesive" },
  { id: 4, name: "Acrylic Sealant 280ml", price: 90, image: "/blog-sealant.jpg", category: "Sealant" },
];

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const product = products.find((p) => p.id === Number(params.id));

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">ไม่พบสินค้า</h1>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-primary text-white rounded">กลับหน้าแรก</button>
      </div>
    );
  }

  const addToCart = () => {
    // mock: alert (ควรใช้ context หรือ localStorage จริงจัง)
    alert(`เพิ่ม ${product.name} จำนวน ${qty} ชิ้น ลงตะกร้า (mock)`);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <button onClick={() => router.push("/")} className="mb-6 text-primary underline">← กลับหน้าแรก</button>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-8">
        <div className="relative w-full md:w-64 h-64">
          <Image src={product.image} alt={product.name} fill className="object-cover rounded-lg" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-primary">{product.name}</h1>
          <div className="text-accent font-semibold text-xl">฿{product.price.toLocaleString()}</div>
          <div className="text-gray-500">หมวดหมู่: {product.category}</div>
          <div className="flex items-center gap-2 mt-4">
            <span>จำนวน:</span>
            <button onClick={() => setQty(q => Math.max(1, q-1))} className="px-2 py-1 bg-gray-200 rounded">-</button>
            <span className="px-3">{qty}</span>
            <button onClick={() => setQty(q => q+1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
          </div>
          <button onClick={addToCart} className="mt-6 bg-accent text-white px-6 py-2 rounded font-bold hover:bg-accent/80 transition">หยิบใส่ตะกร้า</button>
        </div>
      </div>
    </div>
  );
} 