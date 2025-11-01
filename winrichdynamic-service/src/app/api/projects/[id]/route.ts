import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { updateProjectSchema, updateProjectStatusSchema } from '@/schemas/project';

// GET: ดึงข้อมูลโปรเจคตาม ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const project = await Project.findById(resolvedParams.id).lean();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจคนี้' },
        { status: 404 }
      );
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String(project.ownerId) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}
    
    return NextResponse.json(project);
    
  } catch (error) {
    console.error('[Project API] GET by ID Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค' },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทข้อมูลโปรเจค
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = updateProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const updateData = { ...parsed.data } as any;

    await connectDB();
    const resolvedParams = await params;
    
    // ตรวจสอบว่าโปรเจคมีอยู่จริงหรือไม่
    const existingProject = await Project.findById(resolvedParams.id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจคนี้' },
        { status: 404 }
      );
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String(existingProject.ownerId) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // อัพเดทข้อมูลโปรเจค
    const updatedProject = await Project.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();
    
    return NextResponse.json(updatedProject);
    
  } catch (error) {
    console.error('[Project API] PUT Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'ข้อมูลโปรเจคซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลโปรเจค' },
      { status: 500 }
    );
  }
}

// DELETE: ลบโปรเจค
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    // ตรวจสอบว่าโปรเจคมีอยู่จริงหรือไม่
    const existingProject = await Project.findById(resolvedParams.id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจคนี้' },
        { status: 404 }
      );
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String(existingProject.ownerId) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}
    
    // ลบโปรเจค
    await Project.findByIdAndDelete(resolvedParams.id);
    
    return NextResponse.json({
      message: 'ลบโปรเจคเรียบร้อยแล้ว',
      project: existingProject
    });
    
  } catch (error) {
    console.error('[Project API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบโปรเจค' },
      { status: 500 }
    );
  }
}

// PATCH: อัพเดทสถานะโปรเจค
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = updateProjectStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;

    await connectDB();
    const resolvedParams = await params;
    
    // ตรวจสอบว่าโปรเจคมีอยู่จริงหรือไม่
    const existingProject = await Project.findById(resolvedParams.id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจคนี้' },
        { status: 404 }
      );
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String(existingProject.ownerId) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}

    // อัพเดทสถานะโปรเจค
    const updateData: any = { status };
    if (notes) {
      updateData.description = existingProject.description 
        ? `${existingProject.description}\n\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();
    
    return NextResponse.json(updatedProject);
    
  } catch (error) {
    console.error('[Project API] PATCH Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะโปรเจค' },
      { status: 500 }
    );
  }
}