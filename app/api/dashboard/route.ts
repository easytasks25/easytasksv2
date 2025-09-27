import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Dashboard Statistiken
    const [
      totalTasks,
      openTasks,
      completedTasks,
      todayTasks,
      overdueTasks,
      completedThisWeek,
      oldestOpenTask
    ] = await Promise.all([
      // Gesamtanzahl Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId
        }
      }),
      // Offene Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId,
          status: 'open'
        }
      }),
      // Erledigte Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId,
          status: 'done'
        }
      }),
      // Heute fällige Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId,
          status: 'open',
          dueDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      // Überfällige Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId,
          status: 'open',
          dueDate: {
            lt: today
          }
        }
      }),
      // Diese Woche erledigte Tasks
      prisma.task.count({
        where: {
          organizationId: membership.organizationId,
          status: 'done',
          completedAt: {
            gte: weekAgo
          }
        }
      }),
      // Älteste offene Task
      prisma.task.findFirst({
        where: {
          organizationId: membership.organizationId,
          status: 'open'
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      })
    ])

    // Berechne Tage seit ältester offener Task
    const daysSinceOldest = oldestOpenTask 
      ? Math.floor((now.getTime() - oldestOpenTask.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      stats: {
        totalTasks,
        openTasks,
        completedTasks,
        todayTasks,
        overdueTasks,
        completedThisWeek,
        daysSinceOldest,
        organization: membership.organization
      }
    })

  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
