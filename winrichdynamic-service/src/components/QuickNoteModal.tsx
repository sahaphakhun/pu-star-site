'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';

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
    <AppModal open onOpenChange={(open) => !open && onClose()}>
      <AppModalContent size="sm">
        <AppModalHeader>
          <AppModalTitle>จดโน้ต/ติดตามแบบด่วน</AppModalTitle>
        </AppModalHeader>
        <AppModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ประเภทกิจกรรม
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="call">โทร</option>
              <option value="meeting">นัด</option>
              <option value="email">อีเมล</option>
              <option value="task">งาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              หมายเหตุ
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="จดบันทึกการติดต่อ..."
              className="h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </AppModalBody>
        <AppModalFooter>
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
        </AppModalFooter>
      </AppModalContent>
    </AppModal>
  );
}
