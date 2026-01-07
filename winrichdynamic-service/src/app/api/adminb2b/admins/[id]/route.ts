import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

const normalizePhone = (rawPhone: string) => {
  const trimmed = String(rawPhone || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+66')) return trimmed.slice(1);
  if (trimmed.startsWith('0')) return `66${trimmed.slice(1)}`;
  return trimmed;
};

const resolveRole = async (roleInput: string) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(roleInput);
  if (isObjectId) {
    return Role.findById(roleInput);
  }
  return Role.findOne({ name: roleInput });
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();

    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.email !== undefined) update.email = body.email || undefined;
    if (body.company !== undefined) update.company = body.company || undefined;
    if (body.position !== undefined) update.position = body.position || undefined;
    if (body.signatureUrl !== undefined) update.signatureUrl = body.signatureUrl || undefined;
    if (body.team !== undefined) update.team = body.team || undefined;
    if (body.zone !== undefined) update.zone = body.zone || undefined;
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);

    if (body.phone !== undefined) {
      const normalized = normalizePhone(body.phone);
      if (!/^66\d{9}$/.test(normalized)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone format' },
          { status: 400 }
        );
      }
      const existingByPhone = await Admin.findOne({
        _id: { $ne: resolvedParams.id },
        phone: normalized,
      }).lean();
      if (existingByPhone) {
        return NextResponse.json(
          { success: false, error: 'Phone already in use' },
          { status: 400 }
        );
      }
      update.phone = normalized;
    }

    if (body.email) {
      const existingByEmail = await Admin.findOne({
        _id: { $ne: resolvedParams.id },
        email: body.email,
      }).lean();
      if (existingByEmail) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    if (body.role !== undefined) {
      const role = await resolveRole(String(body.role));
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Role not found' },
          { status: 400 }
        );
      }
      update.role = role._id;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndUpdate(
      resolvedParams.id,
      { $set: update },
      { new: true }
    ).populate('role', 'name description level');

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    console.error('[B2B] PATCH /adminb2b/admins/:id error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to update admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;

    const deleted = await Admin.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /adminb2b/admins/:id error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to delete admin' },
      { status: 500 }
    );
  }
}
