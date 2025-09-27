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
      },
      include: {
        organization: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Organisation gefunden" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bucketId = searchParams.get('bucketId')
    const hideCompleted = searchParams.get('hideCompleted') === 'true'

    const where: any = {
      organizationId: membership.organizationId,
    }

    if (status) {
      where.status = status
    }

    if (bucketId) {
      where.bucketId = bucketId
    }

    if (hideCompleted) {
      where.status = 'open'
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        bucket: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error("Tasks fetch error:", error)
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

    const { title, description, priority = 'med', dueDate, bucketId, projectId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "Titel ist erforderlich" },
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

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority,
        status: 'open',
        dueDate: dueDate ? new Date(dueDate) : null,
        bucketId: bucketId || null,
        projectId: projectId || null,
        userId: session.user.id,
        organizationId: membership.organizationId,
      },
      include: {
        bucket: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ task })

  } catch (error) {
    console.error("Task creation error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
