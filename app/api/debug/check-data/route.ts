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

    // Check user's organization membership
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

    if (membershipError) {
      return NextResponse.json({ 
        error: 'No active organization membership found',
        details: membershipError.message
      }, { status: 404 })
    }

    // Check buckets in the organization
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .from('buckets')
      .select('*')
      .eq('organization_id', membership.organization_id)

    // Check tasks in the organization
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('organization_id', membership.organization_id)

    return NextResponse.json({
      user: {
        id: userId
      },
      organization: {
        id: membership.organization_id,
        name: (membership.organizations as any).name
      },
      membership: {
        role: membership.role,
        is_active: membership.is_active
      },
      buckets: buckets || [],
      bucketsCount: buckets?.length || 0,
      tasks: tasks || [],
      tasksCount: tasks?.length || 0,
      errors: {
        membership: membershipError?.message,
        buckets: bucketsError?.message,
        tasks: tasksError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
