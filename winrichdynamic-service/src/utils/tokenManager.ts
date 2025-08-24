'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface TokenManagerReturn {
  getValidToken: () => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useTokenManager = (): TokenManagerReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบ token เมื่อโหลด component
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('b2b_auth_token');
      if (token) {
        try {
          // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
          const isValid = await validateToken(token);
          setIsAuthenticated(isValid);
          if (!isValid) {
            localStorage.removeItem('b2b_auth_token');
            toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('b2b_auth_token');
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // ตรวจสอบความถูกต้องของ token
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/adminb2b/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const result = await response.json();
        return result.valid === true;
      }
      return false;
    } catch (error) {
      console.error('Token validation request failed:', error);
      return false;
    }
  };

  // ดึง token ที่ใช้งานได้
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = localStorage.getItem('b2b_auth_token');
    if (!token) {
      return null;
    }

    try {
      const isValid = await validateToken(token);
      if (isValid) {
        return token;
      } else {
        localStorage.removeItem('b2b_auth_token');
        setIsAuthenticated(false);
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        return null;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('b2b_auth_token');
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  // ออกจากระบบ
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('b2b_auth_token');
      if (token) {
        // เรียก API logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // ลบ token และ redirect
      localStorage.removeItem('b2b_auth_token');
      setIsAuthenticated(false);
      
      // ตรวจสอบว่าอยู่ใน adminb2b route หรือไม่
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/adminb2b')) {
        window.location.href = '/adminb2b/login';
      }
    }
  }, []);

  return {
    getValidToken,
    logout,
    isAuthenticated,
    loading
  };
};
