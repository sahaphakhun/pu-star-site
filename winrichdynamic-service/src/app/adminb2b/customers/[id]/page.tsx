"use client";
import React, { useEffect, useState } from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { Card } from '@/components/ui/Card';
import NotesPanel from '@/components/NotesPanel';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      }
    }
    load();
  }, [id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">รายละเอียดลูกค้า</h1>
      {customer && (
        <Card className="p-4">
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-gray-600">{customer.companyName || '-'}</div>
          <div className="text-sm text-gray-600">{customer.phoneNumber}</div>
        </Card>
      )}
      <ActivityTimeline customerId={id} />
      <NotesPanel customerId={id} />
    </div>
  );
}


