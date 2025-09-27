import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { name, type = 'team', description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Organisationsname ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob User bereits eine Organization besitzt
    const existingMembership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Benutzer ist bereits Mitglied einer Organisation" },
        { status: 400 }
      )
    }

    // Erstelle Organization und Membership in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle Organization
      const organization = await tx.organization.create({
        data: {
          name,
          type,
          description: description || null,
          createdById: session.user.id,
        }
      })

      // Erstelle Membership
      const membership = await tx.userOrganization.create({
        data: {
          userId: session.user.id,
          organizationId: organization.id,
          role: 'owner',
        }
      })

      return { organization, membership }
    })

    return NextResponse.json({
      message: "Organisation erfolgreich erstellt",
      organization: result.organization
    })

  } catch (error) {
    console.error("Organisationsfehler:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
