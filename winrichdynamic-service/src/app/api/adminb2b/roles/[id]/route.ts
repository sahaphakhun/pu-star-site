import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import Admin from '@/models/Admin';

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
    if (body.description !== undefined) update.description = body.description;
    if (body.permissions !== undefined) update.permissions = body.permissions;
    if (body.level !== undefined) update.level = body.level;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const role = await Role.findByIdAndUpdate(
      resolvedParams.id,
      { $set: update },
      { new: true }
    );

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('[B2B] PATCH /adminb2b/roles/:id error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to update role' },
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

    const adminUsingRole = await Admin.findOne({ role: resolvedParams.id }).lean();
    if (adminUsingRole) {
      return NextResponse.json(
        { success: false, error: 'Role is assigned to an admin' },
        { status: 400 }
      );
    }

    const deleted = await Role.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /adminb2b/roles/:id error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to delete role' },
      { status: 500 }
    );
  }
}
