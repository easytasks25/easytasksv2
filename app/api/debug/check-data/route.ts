import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : e ? String(e) : undefined

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    let membershipError: unknown = null
    let bucketsError: unknown = null
    let tasksError: unknown = null

    let membership = null
    let buckets = null
    let tasks = null

    // Check user's organization membership
    try {
      const { data, error } = await supabaseAdmin
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

      if (error) {
        membershipError = error
      } else {
        membership = data
      }
    } catch (e) {
      membershipError = e
    }

    if (membership) {
      // Check buckets in the organization
      try {
        const { data, error } = await supabaseAdmin
          .from('buckets')
          .select('*')
          .eq('organization_id', membership.organization_id)

        if (error) {
          bucketsError = error
        } else {
          buckets = data
        }
      } catch (e) {
        bucketsError = e
      }

      // Check tasks in the organization
      try {
        const { data, error } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('organization_id', membership.organization_id)

        if (error) {
          tasksError = error
        } else {
          tasks = data
        }
      } catch (e) {
        tasksError = e
      }
    }

    return NextResponse.json({
      user: {
        id: userId
      },
      organization: membership ? {
        id: membership.organization_id,
        name: (membership.organizations as any).name
      } : null,
      membership: membership ? {
        role: membership.role,
        is_active: membership.is_active
      } : null,
      buckets: buckets || [],
      bucketsCount: Array.isArray(buckets) ? buckets.length : 0,
      tasks: tasks || [],
      tasksCount: Array.isArray(tasks) ? tasks.length : 0,
      errors: {
        membership: errMsg(membershipError),
        buckets: errMsg(bucketsError),
        tasks: errMsg(tasksError)
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
