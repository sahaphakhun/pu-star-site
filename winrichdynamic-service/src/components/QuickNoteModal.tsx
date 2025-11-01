'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string, type: 'call' | 'meeting' | 'email' | 'task') => Promise<void>;
  customerId?: string;
  dealId?: string;
  quotationId?: string;
}

export default function QuickNoteModal({ 
  isOpen, 
  onClose, 
  onSave, 
  customerId, 
  dealId, 
  quotationId 
}: QuickNoteModalProps) {
  const [note, setNote] = useState('');
  const [type, setType] = useState<'call' | 'meeting' | 'email' | 'task'>('call');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    
    setLoading(true);
    try {
      await onSave(note.trim(), type);
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving quick note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">จดโน้ต/ติดตามแบบด่วน</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทกิจกรรม
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="call">โทร</option>
                <option value="meeting">นัด</option>
                <option value="email">อีเมล</option>
                <option value="task">งาน</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="จดบันทึกการติดต่อ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !note.trim()}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
