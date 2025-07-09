import React, { ReactNode } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Toaster } from 'react-hot-toast';

interface Props {
  children: ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster position="top-right" />
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">{children}</main>
    </div>
  );
};

export default AdminLayout; 