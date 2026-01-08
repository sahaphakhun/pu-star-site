'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useTokenManager } from '@/utils/tokenManager';

type AdminProfile = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  role: string;
  roleLevel: number;
};

type AdminSignature = {
  name?: string;
  position?: string;
  signatureUrl?: string;
};

export default function AdminB2BProfilePage() {
  const { getValidToken } = useTokenManager();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [signature, setSignature] = useState<AdminSignature | null>(null);
  const [position, setPosition] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return null;

    const res = await fetch('/api/adminb2b/profile', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
    }

    return data.data as AdminProfile;
  }, [getValidToken]);

  const loadSignature = useCallback(async (adminId: string) => {
    const res = await fetch(`/api/users/signature?userId=${adminId}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return null;
    }
    return data.user as AdminSignature;
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadedProfile = await loadProfile();
        if (!mounted) return;
        if (!loadedProfile) {
          setProfile(null);
          setSignature(null);
          setPosition('');
          return;
        }

        setProfile(loadedProfile);

        const loadedSignature = await loadSignature(loadedProfile.id);
        if (!mounted) return;
        setSignature(loadedSignature);
        setPosition(loadedSignature?.position || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [loadProfile, loadSignature]);

  const isDirty = useMemo(() => {
    const positionChanged = position !== (signature?.position || '');
    const fileChanged = selectedFile !== null;
    return positionChanged || fileChanged;
  }, [position, selectedFile, signature?.position]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    if (!isDirty) {
      toast('ไม่มีการเปลี่ยนแปลง');
      return;
    }

    setSaving(true);
    try {
      let res: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('userId', profile.id);
        formData.append('position', position);
        formData.append('file', selectedFile);

        res = await fetch('/api/users/signature', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      } else {
        res = await fetch('/api/users/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            position,
          }),
          credentials: 'include',
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'บันทึกไม่สำเร็จ');
      }

      setSignature(data.user as AdminSignature);
      setSelectedFile(null);
      toast.success('บันทึกเรียบร้อย');
    } catch (err) {
      console.error('Failed to save signature:', err);
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  }, [isDirty, position, profile, selectedFile]);

  const handleDeleteSignature = useCallback(async () => {
    if (!profile) return;
    const ok = confirm('ยืนยันการลบลายเซ็น?');
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/users/signature?userId=${profile.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'ลบลายเซ็นไม่สำเร็จ');
      }
      setSignature((prev) => ({ ...(prev || {}), signatureUrl: '' }));
      toast.success('ลบลายเซ็นเรียบร้อย');
    } catch (err) {
      console.error('Failed to delete signature:', err);
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบลายเซ็น');
    } finally {
      setDeleting(false);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading size="lg" label="กำลังโหลดโปรไฟล์..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          ลองใหม่
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
        ไม่พบข้อมูลผู้ใช้งาน
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-800">โปรไฟล์</h2>
        <p className="text-sm text-slate-500">จัดการข้อมูลบัญชีและลายเซ็นสำหรับเอกสาร (PDF)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชี</CardTitle>
            <CardDescription>ข้อมูลนี้ใช้แสดงในระบบ และเป็นผู้เสนอ/ผู้อนุมัติในเอกสาร</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ชื่อ</Label>
                <Input value={profile.name} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>เบอร์โทร</Label>
                <Input value={profile.phone} readOnly />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>อีเมล</Label>
                <Input value={profile.email || ''} readOnly placeholder="-" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>บริษัท</Label>
                <Input value={profile.company || ''} readOnly placeholder="-" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t">
            <div className="text-xs text-slate-500">
              Role: <span className="font-medium text-slate-700">{profile.role}</span> (level {profile.roleLevel})
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ลายเซ็น</CardTitle>
            <CardDescription>ตั้งค่าลายเซ็นและตำแหน่ง เพื่อใช้ในใบเสนอราคา/ใบสั่งขาย</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="position">ตำแหน่ง (แสดงใต้ชื่อในเอกสาร)</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="เช่น Sales Executive"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signatureFile">ไฟล์ลายเซ็น</Label>
              <Input
                id="signatureFile"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div className="text-xs text-slate-500">แนะนำ PNG พื้นหลังใส ขนาดไม่เกิน 2MB</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-600">ตัวอย่างลายเซ็น</div>
              <div className="mt-3 flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-3">
                {signature?.signatureUrl ? (
                  <img
                    src={signature.signatureUrl}
                    alt="signature"
                    className="max-h-24 w-auto object-contain"
                  />
                ) : (
                  <div className="text-sm text-slate-400">ยังไม่มีลายเซ็น</div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteSignature}
              disabled={deleting || !signature?.signatureUrl}
            >
              {deleting ? 'กำลังลบ...' : 'ลบลายเซ็น'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

