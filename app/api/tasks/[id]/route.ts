import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { status, bucketId, completedAt } = await request.json()

    // Prüfe ob Task existiert und User berechtigt ist
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task nicht gefunden" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (bucketId !== undefined) {
      updateData.bucketId = bucketId
    }
    
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null
      if (completedAt) {
        updateData.completedBy = session.user.id
      }
    }

    const task = await prisma.task.update({
      where: {
        id: params.id
      },
      data: updateData,
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
    console.error("Task update error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
