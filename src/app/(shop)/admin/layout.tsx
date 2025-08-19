import React, { ReactNode } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Toaster } from 'react-hot-toast';

interface Props {
  children: ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Toaster position="top-right" />
      <AdminSidebar />
      <main className="pt-16 md:pt-8 p-4 md:p-8 md:ml-56 md:w-[calc(100%-14rem)] overflow-x-auto">{children}</main>
    </div>
  );
};

export default AdminLayout; 