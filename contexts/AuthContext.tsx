'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string, organizationName?: string, organizationType?: 'company' | 'team') => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string, organizationName?: string, organizationType?: 'company' | 'team') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
        },
      })

      if (error) {
        return { error }
      }

      // Create profile and default organization after successful signup
      if (data.user) {
        // Check if profile already exists (created by trigger)
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileCheckError)
          return { error: { message: profileCheckError.message } as AuthError }
        }

        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name || null,
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
            return { error: { message: profileError.message } as AuthError }
          }
        } else {
          // Update existing profile with name if provided
          if (name) {
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ name })
              .eq('id', data.user.id)

            if (updateError) {
              console.error('Error updating profile:', updateError)
              // Don't fail the signup for this
            }
          }
        }

        // Check if user already has an organization
        const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single()

        let organizationId = null

        if (existingMembership) {
          // User already has an organization
          organizationId = existingMembership.organization_id
          console.log('User already has organization:', organizationId)
        } else {
          // Create new organization
          const { data: organization, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
              name: organizationName || (name ? `${name}'s Team` : 'Mein Team'),
              description: organizationType === 'company' ? 'Unternehmen' : 'Team',
              type: organizationType || 'team',
              created_by: data.user.id
            })
            .select()
            .single()

          if (orgError) {
            console.error('Error creating organization:', orgError)
            return { error: { message: orgError.message } as AuthError }
          }

          organizationId = organization.id

          // Create membership
          const { error: membershipError } = await supabaseAdmin
            .from('user_organizations')
            .insert({
              user_id: data.user.id,
              organization_id: organization.id,
              role: 'owner',
              is_active: true
            })

          if (membershipError) {
            console.error('Error creating membership:', membershipError)
            return { error: { message: membershipError.message } as AuthError }
          }
        }

        // Create default buckets for the new user (only if they don't exist)
        if (organizationId) {
          const { data: existingBuckets, error: bucketCheckError } = await supabaseAdmin
            .from('buckets')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('organization_id', organizationId)

          if (!existingBuckets || existingBuckets.length === 0) {
            const defaultBuckets = [
              { name: "Heute", type: "day", color: "#fef3c7", order_index: 1 },
              { name: "Morgen", type: "day", color: "#dbeafe", order_index: 2 },
              { name: "Backlog", type: "custom", color: "#e5efe9", order_index: 3 }
            ]

            for (const bucket of defaultBuckets) {
              const { error: bucketError } = await supabaseAdmin
                .from('buckets')
                .insert({
                  name: bucket.name,
                  type: bucket.type,
                  color: bucket.color,
                  order_index: bucket.order_index,
                  user_id: data.user.id,
                  organization_id: organizationId,
                  project_id: null
                })

              if (bucketError) {
                console.error('Error creating default bucket:', bucketError)
                // Don't fail the entire signup for bucket creation errors
              }
            }
          }
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
