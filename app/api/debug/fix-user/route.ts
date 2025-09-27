import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationName, organizationType } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    // Check if user already has an organization
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (existingMembership) {
      return NextResponse.json({ 
        message: 'User already has an organization',
        organizationId: existingMembership.organization_id
      })
    }

    // Create organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: organizationName || 'Mein Team',
        description: organizationType === 'company' ? 'Unternehmen' : 'Team',
        type: organizationType || 'team',
        created_by: userId
      })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ 
        error: 'Failed to create organization',
        details: orgError.message
      }, { status: 500 })
    }

    // Create membership
    const { error: membershipError } = await supabaseAdmin
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: organization.id,
        role: 'owner',
        is_active: true
      })

    if (membershipError) {
      return NextResponse.json({ 
        error: 'Failed to create membership',
        details: membershipError.message
      }, { status: 500 })
    }

    // Create default buckets
    const defaultBuckets = [
      { name: "Heute", type: "day", color: "#fef3c7", order_index: 1 },
      { name: "Morgen", type: "day", color: "#dbeafe", order_index: 2 },
      { name: "Backlog", type: "custom", color: "#e5efe9", order_index: 3 }
    ]

    const createdBuckets = []
    for (const bucket of defaultBuckets) {
      const { data, error } = await supabaseAdmin
        .from('buckets')
        .insert({
          name: bucket.name,
          type: bucket.type,
          color: bucket.color,
          order_index: bucket.order_index,
          user_id: userId,
          organization_id: organization.id,
          project_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating bucket:', bucket.name, error)
      } else {
        createdBuckets.push(data)
      }
    }

    return NextResponse.json({ 
      message: 'User setup completed successfully',
      organization: organization,
      buckets: createdBuckets
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fix user setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
