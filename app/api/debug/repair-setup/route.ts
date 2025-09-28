import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationName = 'Mein Team', organizationType = 'team' } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    const results = {
      profile: null,
      organization: null,
      membership: null,
      buckets: []
    }

    // 1. Check/Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authUser?.user) {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.user.email!,
            name: authUser.user.user_metadata?.name || null
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          results.profile = newProfile
        }
      }
    } else if (profile) {
      results.profile = profile
    }

    // 2. Check if user has an organization
    const { data: existingMembership } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    let organizationId = null

    if (existingMembership) {
      // User already has an organization
      organizationId = existingMembership.organization_id
      results.organization = existingMembership.organizations
      results.membership = existingMembership
      console.log('User already has organization:', organizationId)
    } else {
      // Create new organization
      const { data: organization, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: organizationName,
          description: organizationType === 'company' ? 'Unternehmen' : 'Team',
          type: organizationType,
          created_by: userId
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating organization:', orgError)
        return NextResponse.json({ 
          error: 'Failed to create organization',
          details: orgError.message
        }, { status: 500 })
      }

      organizationId = organization.id
      results.organization = organization

      // Create membership
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: organization.id,
          role: 'owner',
          is_active: true
        })
        .select()
        .single()

      if (membershipError) {
        console.error('Error creating membership:', membershipError)
        return NextResponse.json({ 
          error: 'Failed to create membership',
          details: membershipError.message
        }, { status: 500 })
      }

      results.membership = membership
    }

    // 3. Create default buckets if they don't exist
    if (organizationId) {
      const { data: existingBuckets } = await supabaseAdmin
        .from('buckets')
        .select('*')
        .eq('organization_id', organizationId)

      if (!existingBuckets || existingBuckets.length === 0) {
        const defaultBuckets = [
          { name: "Heute", type: "day", color: "#fef3c7", order_index: 1 },
          { name: "Morgen", type: "day", color: "#dbeafe", order_index: 2 },
          { name: "Backlog", type: "custom", color: "#e5efe9", order_index: 3 }
        ]

        for (const bucket of defaultBuckets) {
          const { data, error } = await supabaseAdmin
            .from('buckets')
            .insert({
              name: bucket.name,
              type: bucket.type,
              color: bucket.color,
              order_index: bucket.order_index,
              user_id: userId,
              organization_id: organizationId,
              project_id: null
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating default bucket:', bucket.name, error)
          } else {
            results.buckets.push(data)
          }
        }
      } else {
        results.buckets = existingBuckets
      }
    }

    return NextResponse.json({ 
      message: 'Setup repair completed successfully',
      results: results
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to repair setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
