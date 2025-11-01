"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

export default function NotesPanel({ customerId, dealId, quotationId }: { customerId?: string; dealId?: string; quotationId?: string; }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string; name?: string; type?: string }[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (dealId) params.set('dealId', dealId);
    if (quotationId) params.set('quotationId', quotationId);
    params.set('limit', '50');
    const res = await fetch(`/api/notes?${params.toString()}`);
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : (data?.data || []));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, dealId, quotationId]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const next: { url: string; name?: string; type?: string }[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) next.push({ url: data.url, name: f.name, type: f.type });
    }
    setAttachments((prev) => [...prev, ...next]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function saveNote() {
    if (!content.trim() && attachments.length === 0) return;
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, attachments, customerId, dealId, quotationId }),
    });
    if (res.ok) {
      setContent('');
      setAttachments([]);
      await load();
    }
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <Textarea placeholder="จดโน้ต..." value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <input ref={fileRef} type="file" multiple onChange={(e) => onUpload(e.target.files)} />
          <Button onClick={saveNote} disabled={uploading || (!content.trim() && attachments.length === 0)}>
            บันทึกโน้ต
          </Button>
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            ไฟล์แนบ:
            <ul className="list-disc ml-6">
              {attachments.map((a, i) => (
                <li key={i}><a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">{a.name || a.url}</a></li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">เวลา</th>
              <th className="p-2">โน้ต</th>
              <th className="p-2">ไฟล์แนบ</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n._id} className="border-t">
                <td className="p-2">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="p-2 whitespace-pre-wrap">{n.content}</td>
                <td className="p-2">
                  {Array.isArray(n.attachments) && n.attachments.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {n.attachments.map((a: any, i: number) => (
                        <li key={i}><a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">{a.name || a.url}</a></li>
                      ))}
                    </ul>
                  ) : '-'}
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={3}>ยังไม่มีโน้ต</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
