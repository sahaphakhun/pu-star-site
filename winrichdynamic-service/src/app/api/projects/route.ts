import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { createProjectSchema, searchProjectSchema } from '@/schemas/project';

// GET: ดึงโปรเจคทั้งหมด (พร้อมการค้นหาและ pagination)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const customerId = searchParams.get('customerId');
    const ownerId = searchParams.get('ownerId');
    const team = searchParams.get('team');
    const status = searchParams.get('status');
    const importance = searchParams.get('importance');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // สร้าง filter object
    const filter: Record<string, any> = {};
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { projectCode: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    
    if (customerId) {
      filter.customerId = customerId;
    }
    
    if (team) {
      filter.team = { $regex: team, $options: 'i' };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (importance) {
      filter.importance = Number(importance);
    }
    
    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) {
        filter.startDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.startDate.$lte = new Date(dateTo);
      }
    }

    // RBAC: จำกัดข้อมูลสำหรับ Seller
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          // จำกัดเฉพาะของตนเอง ด้วยการใช้ adminId จาก token
          filter.ownerId = payload.adminId;
        } else if (ownerId && roleName === 'admin') {
          // Admin สามารถกรองตาม ownerId ได้
          filter.ownerId = ownerId;
        }
      }
    } catch {}

    // นับจำนวนทั้งหมด
    const total = await Project.countDocuments(filter);
    
    // ดึงข้อมูลโปรเจค
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ถ้าไม่ได้ส่ง query parameters ให้คงรูปแบบ array เดิม
    const hasSearchParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || 
                           searchParams.has('customerId') || searchParams.has('ownerId') || 
                           searchParams.has('team') || searchParams.has('status') || 
                           searchParams.has('importance') || searchParams.has('dateFrom') || searchParams.has('dateTo');
    
    if (!hasSearchParams) {
      return NextResponse.json(projects);
    }

    return NextResponse.json({
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    
  } catch (error) {
    console.error('[Project API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค' },
      { status: 500 }
    );
  }
}

// POST: สร้างโปรเจคใหม่
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const projectData = { ...parsed.data } as any;

    await connectDB();
    
    // ใส่ผู้รับผิดชอบจาก token (ถ้ามี) เพื่อทำ data ownership
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) {
          projectData.ownerId = payload.adminId;
          projectData.ownerName = payload.name || payload.adminName || 'Unknown';
        }
      }
    } catch {}

    // ตรวจสอบว่ามีข้อมูล ownerId และ ownerName หรือไม่
    if (!projectData.ownerId || !projectData.ownerName) {
      return NextResponse.json(
        { error: 'ไม่สามารถระบุผู้รับผิดชอบได้ กรุณาล็อกอินใหม่' },
        { status: 400 }
      );
    }

    // สร้างโปรเจคใหม่
    const project = await Project.create(projectData);
    
    return NextResponse.json(
      project.toObject ? project.toObject() : project,
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Project API] POST Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'ข้อมูลโปรเจคซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างโปรเจค' },
      { status: 500 }
    );
  }
}