"use client";

import React, { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

type LineCommand = {
  _id: string;
  key: string;
  name: string;
  pattern: string;
  description?: string;
  isActive: boolean;
  priority: number;
};

type LineUser = {
  _id: string;
  lineUserId: string;
  displayName?: string;
  canIssueQuotation: boolean;
  isActive: boolean;
  lastSeenAt?: string;
};

type GroupLink = {
  _id: string;
  groupId: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH');
};

export default function LineBotAdminPage() {
  const [commands, setCommands] = useState<LineCommand[]>([]);
  const [users, setUsers] = useState<LineUser[]>([]);
  const [groupLinks, setGroupLinks] = useState<GroupLink[]>([]);

  const [commandError, setCommandError] = useState<string | null>(null);
  const [groupLinkError, setGroupLinkError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const [savingCommandId, setSavingCommandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newGroupId, setNewGroupId] = useState('');
  const [newCustomerCode, setNewCustomerCode] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setCommandError(null);
    setGroupLinkError(null);
    setUserError(null);

    try {
      const [commandRes, groupRes, userRes] = await Promise.all([
        fetch('/api/line-bot/commands'),
        fetch('/api/line-bot/group-links'),
        fetch('/api/line-bot/users'),
      ]);

      const commandData = await commandRes.json();
      const groupData = await groupRes.json();
      const userData = await userRes.json();

      if (commandRes.ok && commandData.success) {
        setCommands(commandData.data || []);
      } else {
        setCommandError(commandData.error || 'โหลดคำสั่ง LINE ไม่สำเร็จ');
      }

      if (groupRes.ok && groupData.success) {
        setGroupLinks(groupData.data || []);
      } else {
        setGroupLinkError(groupData.error || 'โหลดข้อมูลการผูกกลุ่มไม่สำเร็จ');
      }

      if (userRes.ok && userData.success) {
        setUsers(userData.data || []);
      } else {
        setUserError(userData.error || 'โหลดผู้ใช้ LINE ไม่สำเร็จ');
      }
    } catch (error) {
      setCommandError('โหลดข้อมูลไม่สำเร็จ');
      setGroupLinkError('โหลดข้อมูลไม่สำเร็จ');
      setUserError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateCommandField = (id: string, field: keyof LineCommand, value: any) => {
    setCommands((prev) =>
      prev.map((command) =>
        command._id === id ? { ...command, [field]: value } : command
      )
    );
  };

  const handleSaveCommand = async (command: LineCommand) => {
    setSavingCommandId(command._id);
    setCommandError(null);
    try {
      const res = await fetch(`/api/line-bot/commands/${command._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: command.name,
          description: command.description || '',
          pattern: command.pattern,
          priority: command.priority,
          isActive: command.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกคำสั่งไม่สำเร็จ');
      }
      setCommands((prev) =>
        prev.map((item) => (item._id === command._id ? data.data : item))
      );
    } catch (error: any) {
      setCommandError(error?.message || 'บันทึกคำสั่งไม่สำเร็จ');
    } finally {
      setSavingCommandId(null);
    }
  };

  const handleCreateGroupLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setGroupLinkError(null);
    try {
      const res = await fetch('/api/line-bot/group-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: newGroupId.trim(),
          customerCode: newCustomerCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกการผูกกลุ่มไม่สำเร็จ');
      }
      setNewGroupId('');
      setNewCustomerCode('');
      await loadAll();
    } catch (error: any) {
      setGroupLinkError(error?.message || 'บันทึกการผูกกลุ่มไม่สำเร็จ');
    }
  };

  const handleDeleteGroupLink = async (id: string) => {
    setGroupLinkError(null);
    try {
      const res = await fetch(`/api/line-bot/group-links/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ลบการผูกกลุ่มไม่สำเร็จ');
      }
      setGroupLinks((prev) => prev.filter((link) => link._id !== id));
    } catch (error: any) {
      setGroupLinkError(error?.message || 'ลบการผูกกลุ่มไม่สำเร็จ');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<LineUser>) => {
    setUserError(null);
    try {
      const res = await fetch(`/api/line-bot/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'แก้ไขผู้ใช้ LINE ไม่สำเร็จ');
      }
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? data.data : user))
      );
    } catch (error: any) {
      setUserError(error?.message || 'แก้ไขผู้ใช้ LINE ไม่สำเร็จ');
    }
  };

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">LINE Bot Manager</h1>
        <p className="text-sm text-gray-600 mt-1">
          จัดการคำสั่ง LINE, การผูกกลุ่มลูกค้า และสิทธิ์ผู้ใช้งาน
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">คำสั่ง LINE (Regex)</h2>
          {loading && <span className="text-sm text-gray-500">กำลังโหลด...</span>}
        </div>
        {commandError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {commandError}
          </div>
        )}
        <div className="space-y-3">
          {commands.map((command) => (
            <div key={command._id} className="border rounded-lg p-4 bg-white space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-semibold">{command.name}</div>
                <div className="text-xs text-gray-500">key: {command.key}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Pattern (regex)</label>
                  <Input
                    value={command.pattern}
                    onChange={(event) => updateCommandField(command._id, 'pattern', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">ลำดับ</label>
                  <Input
                    type="number"
                    value={command.priority}
                    onChange={(event) => updateCommandField(command._id, 'priority', Number(event.target.value))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={command.isActive}
                    onCheckedChange={(checked) => updateCommandField(command._id, 'isActive', checked)}
                  />
                  <span className="text-sm">{command.isActive ? 'ใช้งาน' : 'ปิด'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">คำอธิบาย</label>
                <Input
                  value={command.description || ''}
                  onChange={(event) => updateCommandField(command._id, 'description', event.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => handleSaveCommand(command)}
                  disabled={savingCommandId === command._id}
                >
                  {savingCommandId === command._id ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ผูกกลุ่ม LINE กับลูกค้า</h2>
        <form onSubmit={handleCreateGroupLink} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 border rounded-lg">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">LINE groupId</label>
            <Input value={newGroupId} onChange={(event) => setNewGroupId(event.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Customer Code</label>
            <Input value={newCustomerCode} onChange={(event) => setNewCustomerCode(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="primary" type="submit">ผูกกลุ่ม</Button>
          </div>
        </form>
        {groupLinkError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {groupLinkError}
          </div>
        )}
        <div className="border rounded-lg bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Group ID</th>
                <th className="p-3">ลูกค้า</th>
                <th className="p-3">รหัสลูกค้า</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {groupLinks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">ยังไม่มีการผูกกลุ่ม</td>
                </tr>
              ) : (
                groupLinks.map((link) => (
                  <tr key={link._id} className="border-t">
                    <td className="p-3 font-mono text-xs">{link.groupId}</td>
                    <td className="p-3">{link.customerName || '-'}</td>
                    <td className="p-3">{link.customerCode || '-'}</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteGroupLink(link._id)}
                      >
                        ลบ
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ผู้ใช้ LINE และสิทธิ์ออกใบเสนอราคา</h2>
        {userError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {userError}
          </div>
        )}
        <div className="border rounded-lg bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">ชื่อผู้ใช้</th>
                <th className="p-3">LINE userId</th>
                <th className="p-3">สิทธิ์ออกใบเสนอราคา</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3">พบล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">ยังไม่มีผู้ใช้ LINE</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-t">
                    <td className="p-3">{user.displayName || '-'}</td>
                    <td className="p-3 font-mono text-xs">{user.lineUserId}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.canIssueQuotation}
                          onCheckedChange={(checked) =>
                            handleUpdateUser(user._id, { canIssueQuotation: checked })
                          }
                        />
                        <span>{user.canIssueQuotation ? 'อนุญาต' : 'ไม่อนุญาต'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) =>
                            handleUpdateUser(user._id, { isActive: checked })
                          }
                        />
                        <span>{user.isActive ? 'ใช้งาน' : 'ปิด'}</span>
                      </div>
                    </td>
                    <td className="p-3">{formatDateTime(user.lastSeenAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
