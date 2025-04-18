import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "../lib/mongodb";
import User from "../models/User";

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