import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ngpsgfwmowxtkjivdyhu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHNnZndtb3d4dGtqaXZkeWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODM3MDEsImV4cCI6MjA3NDU1OTcwMX0.dIfz3rEt-UJNTj_XHLjgDC3tVieS6ZGT7piThpSUpS4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service Role Client für Server-Side Operationen
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHNnZndtb3d4dGtqaXZkeWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk4MzcwMSwiZXhwIjoyMDc0NTU5NzAxfQ.KIaXNl2ABA_jmgf5-EMpdMiiw3ti25oU0E52GgJBCe4'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
