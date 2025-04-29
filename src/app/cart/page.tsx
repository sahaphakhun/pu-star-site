"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// mock ข้อมูลสินค้า (ควรย้ายไป global หรือ context จริงจัง)
const products = [
  { id: 1, name: "PU Sealant 600ml", price: 250, image: "/blog-sealant.jpg" },
  { id: 2, name: "Silicone Sealant 300ml", price: 120, image: "/blog-sealant.jpg" },
  { id: 3, name: "Construction Adhesive 400ml", price: 180, image: "/blog-adhesive.jpg" },
  { id: 4, name: "Acrylic Sealant 280ml", price: 90, image: "/blog-sealant.jpg" },
];

// mock ตะกร้า (ควรใช้ context หรือ localStorage จริงจัง)
const initialCart = [
  { id: 1, qty: 2 },
  { id: 3, qty: 1 },
];

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);

  const updateQty = (id: number, qty: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item))
    );
  };
  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.id);
    return product ? { ...product, qty: item.qty } : null;
  }).filter(Boolean) as (typeof products[0] & { qty: number })[];

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <button onClick={() => router.push("/")} className="mb-6 text-primary underline">← กลับหน้าแรก</button>
      <h1 className="text-2xl font-bold text-primary mb-6">ตะกร้าสินค้า</h1>
      {cartItems.length === 0 ? (
        <div className="text-center text-gray-400 py-16">ไม่มีสินค้าในตะกร้า</div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6">
          <table className="w-full mb-6">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">สินค้า</th>
                <th className="py-2">ราคา</th>
                <th className="py-2">จำนวน</th>
                <th className="py-2">รวม</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">฿{item.price.toLocaleString()}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                      <span className="px-2">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                    </div>
                  </td>
                  <td className="py-2">฿{(item.price * item.qty).toLocaleString()}</td>
                  <td className="py-2">
                    <button onClick={() => removeItem(item.id)} className="text-red-500 underline">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-bold text-xl text-accent">รวมทั้งหมด: ฿{total.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
} 