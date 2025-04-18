import { DefaultSession, DefaultUser } from "next-auth";
// นำเข้า JWT อยู่ในโมดูล declare แล้ว ไม่จำเป็นต้องนำเข้าที่นี่

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
} 