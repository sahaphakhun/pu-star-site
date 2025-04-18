"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      router.push("/");
      router.refresh();
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gray-50 font-prompt">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-primary">เข้าสู่ระบบ</h1>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
          
          <div className="mb-6">
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
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-primary/70"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-primary hover:underline">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
} 