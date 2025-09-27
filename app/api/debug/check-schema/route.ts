import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'organizations', 'user_organizations', 'buckets', 'tasks'])

    if (tablesError) {
      return NextResponse.json({ 
        error: 'Failed to check tables',
        details: tablesError.message 
      }, { status: 500 })
    }

    // Check if we have any data
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('count')
      .limit(1)

    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .from('buckets')
      .select('count')
      .limit(1)

    return NextResponse.json({
      tables: tables?.map(t => t.table_name) || [],
      hasProfiles: !profilesError,
      hasOrganizations: !orgsError,
      hasBuckets: !bucketsError,
      profileCount: profiles?.length || 0,
      organizationCount: organizations?.length || 0,
      bucketCount: buckets?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
