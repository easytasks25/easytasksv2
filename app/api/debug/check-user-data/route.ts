import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    // Check user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Check user's organization membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        organization_id,
        role,
        is_active,
        organizations (
          id,
          name,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    // Check all organizations (for debugging)
    const { data: allOrgs, error: allOrgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    // Check all user_organizations (for debugging)
    const { data: allMemberships, error: allMembershipsError } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        *,
        organizations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Check buckets if organization exists
    let buckets = []
    let tasks = []
    if (membership) {
      const { data: bucketsData } = await supabaseAdmin
        .from('buckets')
        .select('*')
        .eq('organization_id', membership.organization_id)

      const { data: tasksData } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('organization_id', membership.organization_id)

      buckets = bucketsData || []
      tasks = tasksData || []
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: profile?.email || 'unknown'
      },
      profile: profile || null,
      profileError: profileError?.message,
      membership: membership || null,
      membershipError: membershipError?.message,
      organization: membership ? {
        id: membership.organization_id,
        name: (membership.organizations as any).name,
        type: (membership.organizations as any).type
      } : null,
      buckets: buckets,
      bucketsCount: buckets.length,
      tasks: tasks,
      tasksCount: tasks.length,
      debug: {
        allOrganizations: allOrgs || [],
        allMemberships: allMemberships || [],
        allOrgsError: allOrgsError?.message,
        allMembershipsError: allMembershipsError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
