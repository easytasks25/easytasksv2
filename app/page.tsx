import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Prüfe ob User Mitglied einer Organisation ist
  const membershipCount = await prisma.userOrganization.count({
    where: {
      userId: session.user.id,
      isActive: true
    }
  })

  if (membershipCount === 0) {
    redirect("/organizations/create")
  }

  redirect("/dashboard")
}
