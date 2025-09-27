import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import { DashboardClient } from "./dashboard-client"
import ProtectedRoute from "@/components/ProtectedRoute"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Get session from cookies (Supabase auth)
  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb-ngpsgfwmowxtkjivdyhu-auth-token')?.value
  
  if (!accessToken) {
    redirect("/auth/signin")
  }

  // Get user from Supabase session
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
  
  if (authError || !user) {
    redirect("/auth/signin")
  }

  const userId = user.id

  // 1) Aktive Membership ermitteln
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('user_organizations')
    .select(`
      organization_id,
      role,
      is_active,
      organizations (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (membershipError || !membership) {
    redirect("/organizations/create")
  }

  const orgId = membership.organization_id

  // 2) Buckets und Tasks org-scope holen (nicht zu eng filtern)
  const [bucketsResult, tasksResult] = await Promise.all([
    supabaseAdmin
      .from('buckets')
      .select(`
        *,
        tasks (
          *,
          user:profiles (
            id,
            name,
            email
          ),
          bucket:buckets (
            id,
            name
          ),
          project:projects (
            id,
            name
          )
        )
      `)
      .eq('organization_id', orgId)
      .order('order_index', { ascending: true }),
    
    supabaseAdmin
      .from('tasks')
      .select(`
        *,
        user:profiles (
          id,
          name,
          email
        ),
        bucket:buckets (
          id,
          name
        ),
        project:projects (
          id,
          name
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
  ])

  const buckets = bucketsResult.data || []
  const tasks = tasksResult.data || []

  // 3) Debug-Informationen
  const debug = {
    sessionUserId: userId,
    orgId,
    counts: { buckets: buckets.length, tasks: tasks.length },
    sampleBucket: buckets[0]?.name,
    membershipRole: membership.role,
    organizationName: (membership.organizations as any).name
  }

  return (
    <ProtectedRoute>
      {/* Debug-Informationen (temporär) */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 text-xs">
        <pre>{JSON.stringify(debug, null, 2)}</pre>
      </div>
      
      <DashboardClient 
        initialBuckets={buckets}
        initialTasks={tasks}
        user={user}
        organization={{
          id: orgId,
          name: (membership.organizations as any).name
        }}
        userRole={membership.role}
      />
    </ProtectedRoute>
  )
}
