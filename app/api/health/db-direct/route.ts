import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export async function GET() {
  try {
    // Verwende DIRECT_URL für direkte Verbindung
    const directPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL
        }
      }
    })

    await directPrisma.$queryRaw`SELECT now()`
    await directPrisma.$disconnect()
    
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Direct database health check failed:", error)
    return NextResponse.json(
      { ok: false, error: "Direct database connection failed" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
