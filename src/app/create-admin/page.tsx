"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateAdmin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // ตรวจสอบสิทธิ์การเข้าถึง
  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">กำลังโหลด...</div>;
  }

  if (status === "unauthenticated" || !session || session.user.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6">
        <h1 className="mb-4 text-2xl font-bold text-red-600">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-md bg-primary px-4 py-2 text-white"
        >
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูล
    if (!username || !email || !password || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "การสร้างแอดมินล้มเหลว");
      }
      
      setSuccess("สร้างแอดมินสำเร็จ");
      // รีเซ็ตฟอร์ม
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setError(error.message || "เกิดข้อผิดพลาดในการสร้างแอดมิน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 font-prompt">
      <h1 className="mb-6 text-center text-2xl font-bold text-primary">สร้างผู้ดูแลระบบใหม่</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="กรอกชื่อผู้ใช้"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="กรอกอีเมล"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="กรอกรหัสผ่าน"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2 text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-primary/70"
        >
          {loading ? "กำลังสร้างแอดมิน..." : "สร้างแอดมิน"}
        </button>
      </form>
    </div>
  );
} 