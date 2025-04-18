import type { Metadata } from "next";
import { Geist, Geist_Mono, Prompt } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import SessionProvider from "../providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PU STAR - ผลิตภัณฑ์ซีลแลนท์และอุปกรณ์",
  description: "ผู้ผลิตและจำหน่ายซีลแลนท์ และอุปกรณ์คุณภาพดี",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${prompt.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <div className="flex w-full h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
