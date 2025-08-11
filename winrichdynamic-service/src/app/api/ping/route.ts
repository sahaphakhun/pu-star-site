import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check without external dependencies
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'WinRich Dynamic Service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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
