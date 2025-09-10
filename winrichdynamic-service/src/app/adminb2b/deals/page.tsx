"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

type PipelineStage = {
  _id: string;
  name: string;
  order: number;
  color?: string;
  probability?: number;
};

type Deal = {
  _id: string;
  title: string;
  customerName?: string;
  amount: number;
  stageId: string;
  stageName?: string;
  probability?: number;
  status: 'open' | 'won' | 'lost';
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  updatedAt: string;
};

export default function DealsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [q, setQ] = useState('');
  const [team, setTeam] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStages() {
    const res = await fetch('/api/pipeline-stages');
    const data = await res.json();
    setStages(Array.isArray(data) ? data : []);
  }

  async function loadDeals() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (team) params.set('team', team);
    if (ownerId) params.set('ownerId', ownerId);
    const res = await fetch(`/api/deals?${params.toString()}`);
    const data = await res.json();
    setDeals(Array.isArray(data) ? data : (data?.data || []));
    setLoading(false);
  }

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, team, ownerId]);

  const grouped = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    stages.forEach((s) => (map[s._id] = []));
    deals.forEach((d) => {
      if (!map[d.stageId]) map[d.stageId] = [];
      map[d.stageId].push(d);
    });
    return map;
  }, [stages, deals]);

  async function moveDeal(dealId: string, toStageId: string) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId: toStageId }),
    });
    if (res.ok) {
      await loadDeals();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">ดีล (Deals)</h1>
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="ค้นหา..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="ทีม" value={team} onChange={(e) => setTeam(e.target.value)} />
          <Input placeholder="เจ้าของ (ownerId)" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
          <Select value={view} onChange={(e: any) => setView(e.target.value)}>
            <option value="kanban">Kanban</option>
            <option value="list">รายการ</option>
          </Select>
          <Button onClick={loadDeals} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <Card
              key={stage._id}
              className="p-2 bg-white border"
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              onDrop={(e: React.DragEvent) => {
                const dealId = e.dataTransfer.getData('text/plain');
                if (dealId) moveDeal(dealId, stage._id);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium" style={{ color: stage.color || '#111827' }}>{stage.name}</div>
                {typeof stage.probability === 'number' && (
                  <span className="text-xs text-gray-500">{stage.probability}%</span>
                )}
              </div>
              <div className="space-y-2">
                {(grouped[stage._id] || []).map((deal) => (
                  <div
                    key={deal._id}
                    className="rounded border p-2 bg-gray-50"
                    draggable
                    onDragStart={(e: React.DragEvent) => {
                      e.dataTransfer.setData('text/plain', deal._id);
                    }}
                  >
                    <div className="text-sm font-medium">{deal.title}</div>
                    <div className="text-xs text-gray-600">{deal.customerName || '-'} · ฿{deal.amount.toLocaleString()}</div>
                    {deal.approvalStatus && deal.approvalStatus !== 'none' && (
                      <div className="text-[10px] mt-1">
                        สถานะอนุมัติ: <span className="font-medium">{deal.approvalStatus}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">ดีล</th>
                <th className="p-2">ลูกค้า</th>
                <th className="p-2">มูลค่า</th>
                <th className="p-2">สเตจ</th>
                <th className="p-2">อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="p-2">{d.title}</td>
                  <td className="p-2">{d.customerName || '-'}</td>
                  <td className="p-2">฿{d.amount.toLocaleString()}</td>
                  <td className="p-2">{d.stageName || '-'}</td>
                  <td className="p-2">{new Date(d.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}


