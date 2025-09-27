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

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Check if user has organization memberships
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        *,
        organizations (
          id,
          name,
          type,
          created_by
        )
      `)
      .eq('user_id', userId)

    // Check if user has buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .from('buckets')
      .select('*')
      .eq('user_id', userId)

    // Check if user has tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    return NextResponse.json({
      userId,
      authUser: authUser ? {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at
      } : null,
      authError: authError?.message,
      profile: profile || null,
      profileError: profileError?.message,
      memberships: memberships || [],
      membershipsError: membershipsError?.message,
      buckets: buckets || [],
      bucketsError: bucketsError?.message,
      tasks: tasks || [],
      tasksError: tasksError?.message
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
