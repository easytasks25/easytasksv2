import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole User's Organization
    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Organisation gefunden" },
        { status: 404 }
      )
    }

    const buckets = await prisma.bucket.findMany({
      where: {
        organizationId: membership.organizationId,
        userId: session.user.id
      },
      include: {
        tasks: {
          where: {
            status: 'open'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json({ buckets })

  } catch (error) {
    console.error("Buckets fetch error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { name, type = 'custom', color = '#e5efe9', projectId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Bucket-Name ist erforderlich" },
        { status: 400 }
      )
    }

    // Hole User's Organization
    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Organisation gefunden" },
        { status: 404 }
      )
    }

    // Hole die höchste Order-Nummer
    const lastBucket = await prisma.bucket.findFirst({
      where: {
        organizationId: membership.organizationId,
        userId: session.user.id
      },
      orderBy: {
        order: 'desc'
      }
    })

    const bucket = await prisma.bucket.create({
      data: {
        name,
        type,
        color,
        order: (lastBucket?.order || 0) + 1,
        userId: session.user.id,
        organizationId: membership.organizationId,
        projectId: projectId || null,
      }
    })

    return NextResponse.json({ bucket })

  } catch (error) {
    console.error("Bucket creation error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
