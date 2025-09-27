import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId } = await request.json()

    if (!userId || !organizationId) {
      return NextResponse.json({ 
        error: 'userId and organizationId are required' 
      }, { status: 400 })
    }

    // Check if user already has buckets
    const { data: existingBuckets, error: checkError } = await supabaseAdmin
      .from('buckets')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (checkError) {
      return NextResponse.json({ 
        error: 'Failed to check existing buckets',
        details: checkError.message 
      }, { status: 500 })
    }

    if (existingBuckets && existingBuckets.length > 0) {
      return NextResponse.json({ 
        message: 'User already has buckets',
        bucketCount: existingBuckets.length 
      })
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
          organization_id: organizationId,
          project_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating bucket:', error)
        return NextResponse.json({ 
          error: 'Failed to create bucket',
          details: error.message,
          bucket: bucket.name
        }, { status: 500 })
      }

      createdBuckets.push(data)
    }

    return NextResponse.json({ 
      message: 'Default buckets created successfully',
      buckets: createdBuckets 
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create buckets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
