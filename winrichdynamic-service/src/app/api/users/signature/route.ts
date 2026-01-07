import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

/**
 * API สำหรับจัดการลายเซ็นผู้ใช้ฝั่งแอดมิน
 * GET /api/users/signature - ดึงลายเซ็นของแอดมิน
 * POST /api/users/signature - อัปโหลดลายเซ็นของแอดมิน
 */

// GET - ดึงข้อมูลลายเซ็นและตำแหน่ง
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'กรุณาระบุ userId' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await Admin.findById(userId)
            .select('name position signatureUrl role')
            .lean();

        if (!user) {
            return NextResponse.json(
                { error: 'ไม่พบผู้ใช้' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                name: (user as any).name,
                position: (user as any).position || '',
                signatureUrl: (user as any).signatureUrl || '',
                role: (user as any).role,
            },
        });

    } catch (error) {
        console.error('Error getting user signature:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลายเซ็น' },
            { status: 500 }
        );
    }
}

// POST - อัปโหลดลายเซ็น
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, signatureUrl, position } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'กรุณาระบุ userId' },
                { status: 400 }
            );
        }

        if (!signatureUrl && !position) {
            return NextResponse.json(
                { error: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' },
                { status: 400 }
            );
        }

        await connectDB();

        const updateData: any = {};
        if (signatureUrl !== undefined) {
            updateData.signatureUrl = signatureUrl;
        }
        if (position !== undefined) {
            updateData.position = position;
        }

        const user = await Admin.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('name position signatureUrl role');

        if (!user) {
            return NextResponse.json(
                { error: 'ไม่พบผู้ใช้' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'อัปเดตลายเซ็นสำเร็จ',
            user: {
                name: user.name,
                position: user.position || '',
                signatureUrl: user.signatureUrl || '',
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Error updating user signature:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการอัปเดตลายเซ็น' },
            { status: 500 }
        );
    }
}

// DELETE - ลบลายเซ็น
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'กรุณาระบุ userId' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await Admin.findByIdAndUpdate(
            userId,
            { $unset: { signatureUrl: 1 } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { error: 'ไม่พบผู้ใช้' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'ลบลายเซ็นสำเร็จ',
        });

    } catch (error) {
        console.error('Error deleting user signature:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการลบลายเซ็น' },
            { status: 500 }
        );
    }
}
