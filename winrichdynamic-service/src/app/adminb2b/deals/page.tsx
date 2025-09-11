"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import QuickNoteModal from '@/components/QuickNoteModal';
import { useSavedFilters } from '@/hooks/useSavedFilters';

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
  customerId?: string;
  customerName?: string;
  amount: number;
  stageId: string;
  stageName?: string;
  probability?: number;
  status: 'open' | 'won' | 'lost';
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  updatedAt: string;
  lastActivityAt?: string;
};

export default function DealsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [q, setQ] = useState('');
  const [team, setTeam] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [sortBy, setSortBy] = useState<'last' | 'amount' | 'stage'>('last');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  const { savedFilters, saveFilter, deleteFilter, applyFilter } = useSavedFilters('deals');

  async function loadStages() {
    const res = await fetch('/api/pipeline-stages');
    const data = await res.json();
    setStages(Array.isArray(data) ? data : []);
  }

  async function loadDeals() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (team) params.set('team', team);
      if (ownerId) params.set('ownerId', ownerId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(`/api/deals?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('Failed to fetch deals');
      
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStages();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDeals();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
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

  // Memoized deal cards for better performance
  const DealCard = React.memo(({ deal }: { deal: Deal }) => {
    const getLastDate = () => new Date(deal.lastActivityAt || deal.updatedAt);
    const formatRelative = (d: Date) => {
      const now = new Date().getTime();
      const diffMs = now - d.getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 60) return `${minutes} นาที`; // under 1h
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} ชม.`; // under 1d
      const days = Math.floor(hours / 24);
      return `${days} วัน`;
    };
    const colorClass = (d: Date) => {
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days > 14) return 'text-red-600';
      if (days > 7) return 'text-orange-600';
      return 'text-gray-600';
    };
    const last = getLastDate();
    return (
      <div
        className="rounded border p-2 bg-gray-50"
        draggable
        onDragStart={(e: React.DragEvent) => {
          e.dataTransfer.setData('text/plain', deal._id);
        }}
      >
        <div className="text-sm font-medium">{deal.title}</div>
        <div className="text-xs text-gray-600">{deal.customerName || '-'} · ฿{deal.amount.toLocaleString()}</div>
        <div className={`text-[10px] mt-1 ${colorClass(last)}`} title={last.toLocaleString()}>
          ⏱ ล่าสุด {formatRelative(last)}
        </div>
        {deal.approvalStatus && deal.approvalStatus !== 'none' && (
          <div className="text-[10px] mt-1">
            สถานะอนุมัติ: <span className="font-medium">{deal.approvalStatus}</span>
          </div>
        )}
        <div className="mt-2 flex gap-1">
          <button
            onClick={() => {
              setSelectedDeal(deal);
              setShowQuickNote(true);
            }}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            จดโน้ต
          </button>
        </div>
      </div>
    );
  });

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

  async function saveQuickNote(note: string, type: 'call' | 'meeting' | 'email' | 'task') {
    if (!selectedDeal) return;
    
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        subject: `กิจกรรม${type === 'call' ? 'โทร' : type === 'meeting' ? 'นัด' : type === 'email' ? 'อีเมล' : 'งาน'}`,
        notes: note,
        customerId: selectedDeal.customerId || '',
        dealId: selectedDeal._id,
        status: 'done',
      }),
    });
    
    if (res.ok) {
      setShowQuickNote(false);
      setSelectedDeal(null);
    }
  }

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const filters = { q, team, ownerId, view };
    saveFilter(filterName.trim(), filters);
    setFilterName('');
    setShowSaveFilter(false);
  };

  const handleApplyFilter = (filterId: string) => {
    const filters = applyFilter(filterId);
    if (filters) {
      setQ(filters.q || '');
      setTeam(filters.team || '');
      setOwnerId(filters.ownerId || '');
      setView(filters.view || 'kanban');
    }
  };

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
          {view === 'list' && (
            <>
              <Select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)}>
                <option value="last">กิจกรรมล่าสุด</option>
                <option value="amount">มูลค่า</option>
                <option value="stage">สเตจ</option>
              </Select>
              <Button onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}>
                {sortDir === 'desc' ? '↓' : '↑'}
              </Button>
            </>
          )}
          <Button className="w-40" onClick={() => setShowSaveFilter(true)}>บันทึกมุมมอง</Button>
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
                  <DealCard key={deal._id} deal={deal} />
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
                <th className="p-2">กิจกรรมล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {([...deals]
                .sort((a, b) => {
                  const getLast = (x: Deal) => new Date(x.lastActivityAt || x.updatedAt).getTime();
                  if (sortBy === 'last') {
                    return sortDir === 'desc' ? getLast(b) - getLast(a) : getLast(a) - getLast(b);
                  }
                  if (sortBy === 'amount') {
                    return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
                  }
                  // stage
                  const sa = (a.stageName || '').localeCompare(b.stageName || '');
                  return sortDir === 'desc' ? -sa : sa;
                }))
                .map((d) => {
                  const last = new Date(d.lastActivityAt || d.updatedAt);
                  return (
                    <tr key={d._id} className="border-t">
                      <td className="p-2">{d.title}</td>
                      <td className="p-2">{d.customerName || '-'}</td>
                      <td className="p-2">฿{d.amount.toLocaleString()}</td>
                      <td className="p-2">{d.stageName || '-'}</td>
                      <td className="p-2" title={last.toLocaleString()}>{last.toLocaleDateString()} {last.toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      )}
      
      {/* Saved Filters Dropdown */}
      {savedFilters.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">มุมมองที่บันทึกไว้</h3>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                <button
                  onClick={() => handleApplyFilter(filter.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {filter.name}
                </button>
                <button
                  onClick={() => deleteFilter(filter.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Save Filter Modal */}
      {showSaveFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">บันทึกมุมมอง</h3>
              <Input
                placeholder="ชื่อมุมมอง..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowSaveFilter(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <QuickNoteModal
        isOpen={showQuickNote}
        onClose={() => {
          setShowQuickNote(false);
          setSelectedDeal(null);
        }}
        onSave={saveQuickNote}
        customerId={selectedDeal?.customerId || ''}
        dealId={selectedDeal?._id}
      />
    </div>
  );
}


