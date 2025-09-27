import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Prüfe ob User Mitglied einer Organisation ist
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
    redirect("/organizations/create")
  }

  // Hole Dashboard-Daten
  const [buckets, tasks, dashboardStats] = await Promise.all([
    prisma.bucket.findMany({
      where: {
        organizationId: membership.organizationId,
        userId: session.user.id
      },
      include: {
        tasks: {
          where: {
            status: 'open'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            bucket: true,
            project: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    }),
    prisma.task.findMany({
      where: {
        organizationId: membership.organizationId,
        status: 'open'
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard`, {
      headers: {
        Cookie: `next-auth.session-token=${session.user.id}` // Vereinfacht für Server-Side
      }
    }).then(res => res.json()).catch(() => ({ stats: {} }))
  ])

  return (
    <DashboardClient 
      initialBuckets={buckets}
      initialTasks={tasks}
      initialStats={dashboardStats.stats}
      user={session.user}
      organization={membership.organization}
    />
  )
}
