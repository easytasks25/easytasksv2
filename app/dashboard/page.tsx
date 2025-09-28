import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardClient />
    </ProtectedRoute>
  )
}
