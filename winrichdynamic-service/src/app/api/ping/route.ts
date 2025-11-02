import { NextResponse } from 'next/server'

export async function GET() {
  // Minimal health check used by Railway and Docker HEALTHCHECK
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
