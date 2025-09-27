import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId, role = 'owner' } = await request.json()

    if (!userId || !organizationId) {
      return NextResponse.json({ 
        error: 'userId and organizationId are required' 
      }, { status: 400 })
    }

    // Check if user already has a membership
    const { data: existingMembership, error: checkError } = await supabaseAdmin
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (existingMembership) {
      return NextResponse.json({ 
        message: 'User already has an active membership',
        membership: existingMembership
      })
    }

    // Create the membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role: role,
        is_active: true
      })
      .select()
      .single()

    if (membershipError) {
      return NextResponse.json({ 
        error: 'Failed to create membership',
        details: membershipError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User successfully linked to organization',
      membership: membership
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to link user to organization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
