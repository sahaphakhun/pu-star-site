import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import { cookies } from "next/headers";

// เพิ่ม type สำหรับ session แบบกำหนดเอง
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'user' | 'admin';
    }
  }
}

// เพิ่ม type สำหรับ JWT แบบกำหนดเอง
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'user' | 'admin';
  }
}

// ผลลัพธ์จากการตรวจสอบการยืนยันตัวตน
interface AuthResult {
  success: boolean;
  message?: string;
  user?: {
    _id: string;
    phoneNumber?: string;
    name?: string;
    role: 'user' | 'admin';
  };
}

// สำหรับถอดรหัส JWT token
interface DecodedToken {
  userId: string;
  phoneNumber?: string;
  role?: string;
  [key: string]: unknown;
}

// ตรวจสอบการยืนยันตัวตนจาก JWT ในคำขอ API
export async function verifyAuth(req: Request): Promise<AuthResult> {
  try {
    // ดึง token จาก cookies หรือ Authorization header
    const cookieStore = cookies();
    const tokenFromCookie = cookieStore.get('token');
    const authHeader = req.headers.get('authorization');
    
    let token: string | undefined;
    
    if (tokenFromCookie) {
      token = tokenFromCookie.value;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      return { success: false, message: 'ไม่พบ token สำหรับการยืนยันตัวตน' };
    }
    
    // ตรวจสอบและถอดรหัส token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default_secret_replace_in_production'
    ) as DecodedToken;
    
    if (!decoded || !decoded.userId) {
      return { success: false, message: 'Token ไม่ถูกต้อง' };
    }
    
    // ค้นหาข้อมูลผู้ใช้จากฐานข้อมูล
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    }
    
    // ส่งข้อมูลผู้ใช้กลับไป
    return { 
      success: true, 
      user: {
        _id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role || 'user',
      } 
    };
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบการยืนยันตัวตน:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบการยืนยันตัวตน' };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user) {
          throw new Error("ไม่พบบัญชีผู้ใช้");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        // แปลง _id เป็น string และส่งกลับข้อมูลในรูปแบบที่ NextAuth ต้องการ
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 