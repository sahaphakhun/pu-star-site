"use client";
import React, { useEffect, useState } from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { Card } from '@/components/ui/Card';
import NotesPanel from '@/components/NotesPanel';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deal, setDeal] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/deals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDeal(data);
      }
    }
    load();
  }, [id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">รายละเอียดดีล</h1>
      {deal && (
        <Card className="p-4">
          <div className="font-medium">{deal.title}</div>
          <div className="text-sm text-gray-600">{deal.customerName || '-'}</div>
          <div className="text-sm text-gray-600">มูลค่า ฿{Number(deal.amount || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-600">สเตจ: {deal.stageName || '-'}</div>
        </Card>
      )}
      <ActivityTimeline dealId={id} quotationIds={Array.isArray(deal?.quotationIds) ? deal.quotationIds : undefined} />
      <NotesPanel dealId={id} />
    </div>
  );
}


