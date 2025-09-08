import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Customer from '@/models/Customer'

export async function GET() {
  try {
    // Health check + simple backfill (best-effort, throttled)
    await connectDB()

    // เติมรหัสลูกค้าให้เอกสารที่ยังไม่มีแบบ batch เล็ก ๆ ต่อคำขอ
    const limit = 50
    const customers = await Customer.find({ customerCode: { $exists: false } }).limit(limit)

    for (const doc of customers) {
      if (!doc.customerCode) {
        try {
          // ใช้ static บนโมเดลเพื่อสร้างรหัสที่ไม่ซ้ำ
          const code = await (Customer as any).generateUniqueCustomerCode()
          doc.customerCode = code
          await doc.save()
        } catch (e) {
          // ข้ามรายการที่มีปัญหาเพื่อไม่ให้ health check ล้มเหลว
          continue
        }
      }
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'WinRich Dynamic Service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        backfilled: customers.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Service is running but health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
