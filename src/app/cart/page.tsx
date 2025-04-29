export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg flex flex-col items-center">
        <h1 className="text-2xl font-bold text-primary mb-4">ตะกร้าสินค้า</h1>
        <div className="text-gray-500 mb-8">ยังไม่มีสินค้าในตะกร้า</div>
        <button className="bg-accent text-white px-6 py-2 rounded font-semibold shadow hover:bg-accent/80 transition mb-2" disabled>
          ไปชำระเงิน
        </button>
        <a href="/" className="text-primary underline">กลับหน้าหลัก</a>
      </div>
    </div>
  );
} 