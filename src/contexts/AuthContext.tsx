'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.isLoggedIn && data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
        return true;
      } else {
        setUser(null);
        setIsLoggedIn(false);
        return false;
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการล็อกอิน:', error);
      setUser(null);
      setIsLoggedIn(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        setUser(null);
        setIsLoggedIn(false);
        // ถ้าผู้ใช้อยู่ในหน้าที่ต้องล็อกอิน ให้นำกลับไปที่หน้าล็อกอิน
        if (pathname.startsWith('/admin') || pathname.startsWith('/profile')) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
    }
  };

  useEffect(() => {
    // ตรวจสอบสถานะการล็อกอินเมื่อโหลดแอปครั้งแรก
    checkAuth();
  }, []);

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 