"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const products = [
  { id: 1, name: "PU Sealant 600ml", price: 250, image: "/blog-sealant.jpg", category: "Sealant" },
  { id: 2, name: "Silicone Sealant 300ml", price: 120, image: "/blog-sealant.jpg", category: "Sealant" },
  { id: 3, name: "Construction Adhesive 400ml", price: 180, image: "/blog-adhesive.jpg", category: "Adhesive" },
  { id: 4, name: "Acrylic Sealant 280ml", price: 90, image: "/blog-sealant.jpg", category: "Sealant" },
];

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">ไม่พบสินค้า</h1>
        <Link href="/" className="text-primary underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <div className="relative w-64 h-48 mb-4">
          <Image src={product.image} alt={product.name} fill className="object-cover rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">{product.name}</h1>
        <div className="text-accent font-semibold text-xl mb-2">฿{product.price.toLocaleString()}</div>
        <div className="mb-4 text-gray-500">หมวดหมู่: {product.category}</div>
        <button className="bg-accent text-white px-6 py-2 rounded font-semibold shadow hover:bg-accent/80 transition">หยิบใส่ตะกร้า</button>
        <Link href="/" className="mt-6 text-primary underline">กลับหน้าหลัก</Link>
      </div>
    </div>
  );
} 