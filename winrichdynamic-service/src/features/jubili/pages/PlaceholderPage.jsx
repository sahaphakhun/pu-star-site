import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Construction className="h-16 w-16 mx-auto text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="text-sm text-gray-500">
          หน้านี้อยู่ระหว่างการพัฒนา
        </div>
      </div>
    </div>
  );
}
