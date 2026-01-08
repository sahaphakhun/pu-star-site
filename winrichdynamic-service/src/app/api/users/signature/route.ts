import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import cloudinary from '@/lib/cloudinary';

/**
 * API สำหรับจัดการลายเซ็นผู้ใช้ฝั่งแอดมิน
 * GET /api/users/signature - ดึงลายเซ็นของแอดมิน
 * POST /api/users/signature - อัปโหลด/อัปเดตลายเซ็นของแอดมิน (รองรับ JSON และ form-data)
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
        const contentType = request.headers.get('content-type') || '';

        let userId: string | null = null;
        let signatureUrl: string | undefined;
        let position: string | undefined;
        let file: File | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const rawUserId = formData.get('userId');
            userId = typeof rawUserId === 'string' ? rawUserId : null;

            const rawSignatureUrl = formData.get('signatureUrl');
            signatureUrl = typeof rawSignatureUrl === 'string' ? rawSignatureUrl : undefined;

            const rawPosition = formData.get('position');
            position = typeof rawPosition === 'string' ? rawPosition : undefined;

            const rawFile = formData.get('file');
            file = rawFile instanceof File ? rawFile : null;
        } else {
            const body = await request.json();
            userId = body?.userId ?? null;
            signatureUrl = body?.signatureUrl;
            position = body?.position;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'กรุณาระบุ userId' },
                { status: 400 }
            );
        }

        const hasSignatureUrl = signatureUrl !== undefined;
        const hasPosition = position !== undefined;

        if (!file && !hasSignatureUrl && !hasPosition) {
            return NextResponse.json(
                { error: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' },
                { status: 400 }
            );
        }

        await connectDB();

        const updateData: any = {};

        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: 'ชนิดไฟล์ไม่รองรับ (รองรับ: PNG, JPEG, JPG, WebP)' },
                    { status: 400 }
                );
            }

            // 2MB
            if (file.size > 2 * 1024 * 1024) {
                return NextResponse.json(
                    { error: 'ไฟล์ใหญ่เกินไป (สูงสุด 2MB)' },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadResult = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'winrich-signatures',
                        resource_type: 'image',
                        overwrite: true,
                        public_id: `admin-signature-${userId}`,
                        transformation: [
                            { width: 800, height: 400, crop: 'limit' }
                        ]
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(buffer);
            });

            updateData.signatureUrl = uploadResult.secure_url;
        } else if (signatureUrl !== undefined) {
            updateData.signatureUrl = signatureUrl;
        }

        if (position !== undefined) {
            updateData.position = position;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' },
                { status: 400 }
            );
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
