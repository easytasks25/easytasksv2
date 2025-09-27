import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT now()`
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      { ok: false, error: "Database connection failed" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
