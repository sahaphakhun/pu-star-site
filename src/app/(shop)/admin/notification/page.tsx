'use client';

import React, { useState, FormEvent } from 'react';

interface SMSResponseData {
  code: string;
  status: string;
  msg: string;
  creditUsed: string;
  requestNo: string;
  credit_balance: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: SMSResponseData;
}

const AdminNotificationPage = () => {
  const [targetType, setTargetType] = useState<'all'|'admin'|'custom'>('all');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  // ตรวจสอบจำนวนเครดิตที่จะใช้
  const calculateCredits = (msg: string): number => {
    // เกณฑ์จาก API: ภาษาไทย 70 ตัวอักษรเท่ากับ 1 เครดิต / ภาษาอังกฤษ 140 ตัวอักษรเท่ากับ 1 เครดิต
    const thaiChars = msg.match(/[\u0E00-\u0E7F]/g);
    const thaiCount = thaiChars ? thaiChars.length : 0;
    
    if (thaiCount > 0) {
      // ถ้ามีตัวอักษรภาษาไทย ให้ใช้เกณฑ์ 70 ตัวอักษร/เครดิต
      return Math.ceil(msg.length / 70);
    } else {
      // ถ้าเป็นภาษาอังกฤษหรือตัวเลข ให้ใช้เกณฑ์ 140 ตัวอักษร/เครดิต
      return Math.ceil(msg.length / 140);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message) {
      alert('กรุณากรอกข้อความ');
      return;
    }

    let recipientsCount = 1;
    let numbers: string[] = [];
    if(targetType==='custom'){
      numbers = phoneNumbers.split(/\n|,|;/).map(s=>s.trim()).filter(Boolean);
      if(numbers.length===0){
        alert('กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 1 หมายเลข');
        return;
      }
      recipientsCount = numbers.length;
    }

    const creditsPerMsg = calculateCredits(message);
    const totalCredits = creditsPerMsg * recipientsCount;
    if (!confirm(`ยืนยันการส่ง SMS แบบ ${targetType==='custom' ? 'กำหนดเอง' : targetType==='admin' ? 'แอดมิน' : 'ทุกคน'} (คาดว่าจะใช้ประมาณ ${totalCredits} เครดิต)?`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/notification/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetType, phoneNumbers: numbers, message }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setPhoneNumbers('');
        setMessage('');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่ง SMS:', error);
      setResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่ง SMS',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">บอร์ดแคสต์ข้อความ (SMS)</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">กลุ่มผู้รับ</label>
            <select value={targetType} onChange={e=>setTargetType(e.target.value as any)} className="shadow border rounded w-full py-2 px-3 text-gray-700">
              <option value="all">ส่งหาทุกคน</option>
              <option value="admin">ส่งหาแอดมิน</option>
              <option value="custom">ส่งตามเบอร์ที่กำหนด</option>
            </select>
          </div>

          {targetType==='custom' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">เบอร์โทรศัพท์ (1 เบอร์ต่อบรรทัด)</label>
              <textarea value={phoneNumbers} onChange={e=>setPhoneNumbers(e.target.value)} rows={4} className="shadow border rounded w-full py-2 px-3 text-gray-700" placeholder="0812345678"></textarea>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              ข้อความ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={5}
              placeholder="ข้อความที่ต้องการส่ง..."
            />
            <div className="text-gray-500 text-xs mt-1 flex justify-between">
              <span>จำนวนตัวอักษร: {message.length}</span>
              <span>ประมาณการเครดิตที่ใช้: {calculateCredits(message)}</span>
            </div>
            <p className="text-gray-500 text-xs">
              (ภาษาไทย 70 ตัวอักษร = 1 เครดิต, ภาษาอังกฤษ 140 ตัวอักษร = 1 เครดิต)
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={sending}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                sending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {sending ? 'กำลังส่ง...' : 'ส่ง SMS'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div
          className={`border ${
            result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          } rounded-lg p-4 mb-6`}
        >
          <h2 className={`font-bold ${result.success ? 'text-green-700' : 'text-red-700'} mb-2`}>
            {result.success ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
          </h2>
          <p className="mb-1">{result.message}</p>
          
          {result.success && result.data && (
            <div className="mt-3 p-3 bg-white rounded border text-sm">
              <h3 className="font-bold mb-1">รายละเอียดการส่ง</h3>
              <p>รหัสสถานะ: {result.data.code} ({result.data.status})</p>
              <p>ข้อความ: {result.data.msg}</p>
              <p>เครดิตที่ใช้: {result.data.creditUsed}</p>
              <p>เครดิตคงเหลือ: {result.data.credit_balance}</p>
              <p>เลขที่คำขอ: {result.data.requestNo}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-bold text-blue-700 mb-2">คำแนะนำการใช้งาน</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>สามารถส่ง SMS ได้เฉพาะเบอร์โทรศัพท์ในประเทศไทยเท่านั้น</li>
          <li>ระวังการใช้อักขระพิเศษที่อาจทำให้ข้อความถูกแบ่งเป็นหลาย SMS</li>
          <li>หากต้องการส่งข้อความถึงลูกค้าหลายคน แนะนำให้ใช้ฟีเจอร์ส่ง SMS แบบกลุ่ม</li>
          <li>SMS ที่มีภาษาไทยจะมีขนาดสั้นกว่า SMS ภาษาอังกฤษประมาณ 2 เท่า</li>
          <li>สำหรับการแจ้งเตือนทั่วไป ควรใช้ภาษาที่กระชับเพื่อประหยัดเครดิต</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminNotificationPage; 