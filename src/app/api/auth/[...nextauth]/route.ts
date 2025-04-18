import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { connectToDB } from "@/lib/mongodb";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        }

        try {
          await connectToDB();
          
          const user = await User.findOne({ username: credentials.username });
          
          if (!user) {
            throw new Error("ไม่พบชื่อผู้ใช้นี้");
          }
          
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!passwordMatch) {
            throw new Error("รหัสผ่านไม่ถูกต้อง");
          }
          
          return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          throw new Error(error.message || "การเข้าสู่ระบบล้มเหลว");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          role: token.role as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 