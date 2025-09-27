import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "next-auth/react"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email und Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Benutzer mit dieser E-Mail existiert bereits" },
        { status: 400 }
      )
    }

    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(password, 12)

    // Erstelle User, Organization und Membership in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        }
      })

      // Erstelle Organization
      const organization = await tx.organization.create({
        data: {
          name: `${name || email.split('@')[0]}'s Team`,
          type: 'team',
          createdById: user.id,
        }
      })

      // Erstelle Membership
      const membership = await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
        }
      })

      return { user, organization, membership }
    })

    return NextResponse.json({
      message: "Registrierung erfolgreich",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      }
    })

  } catch (error) {
    console.error("Registrierungsfehler:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
