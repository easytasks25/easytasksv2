"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Mail, UserPlus, Trash2, Crown, Shield, User } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  joined_at: string
  is_active: boolean
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  accepted_at: string | null
}

export default function UsersPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (user) {
      loadUsers()
    }
  }, [user])

  const loadUsers = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Get user's role
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!membership) {
        setError('Keine Organisation gefunden')
        return
      }

      setUserRole(membership.role)

      // Only owners and admins can manage users
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        setError('Keine Berechtigung für Benutzerverwaltung')
        return
      }

      // Load all users in the organization
      const { data: usersData, error: usersError } = await supabase
        .from('user_organizations')
        .select(`
          role,
          joined_at,
          is_active,
          profiles (
            id,
            email,
            name
          )
        `)
        .eq('organization_id', membership.organization_id)
        .eq('is_active', true)

      if (usersError) {
        console.error('Error loading users:', usersError)
        setError('Fehler beim Laden der Benutzer')
        return
      }

      const formattedUsers = usersData.map(u => ({
        id: u.profiles.id,
        email: u.profiles.email,
        name: u.profiles.name,
        role: u.role,
        joined_at: u.joined_at,
        is_active: u.is_active
      }))

      setUsers(formattedUsers)

      // Load pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError)
      } else {
        setInvitations(invitationsData || [])
      }

    } catch (error) {
      console.error('Error loading users:', error)
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inviteEmail) return

    try {
      setIsInviting(true)
      setError("")

      // Get organization ID
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!membership) {
        setError('Keine Organisation gefunden')
        return
      }

      // Generate invitation token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      // Create invitation
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail,
          organization_id: membership.organization_id,
          role: inviteRole,
          token: token,
          expires_at: expiresAt.toISOString(),
          invited_by: user.id
        })

      if (error) {
        console.error('Error creating invitation:', error)
        setError('Fehler beim Senden der Einladung')
        return
      }

      // TODO: Send email with invitation link
      // For now, we'll just show the invitation link
      const invitationLink = `${window.location.origin}/auth/accept-invitation?token=${token}`
      
      setSuccess(`Einladung gesendet! Link: ${invitationLink}`)
      setInviteEmail("")
      setInviteRole("member")
      
      // Reload invitations
      await loadUsers()

    } catch (error) {
      console.error('Error sending invitation:', error)
      setError('Fehler beim Senden der Einladung')
    } finally {
      setIsInviting(false)
    }
  }

  const removeUser = async (userId: string) => {
    if (!user || !confirm('Benutzer wirklich entfernen?')) return

    try {
      // Get organization ID
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!membership) return

      // Deactivate user membership
      const { error } = await supabase
        .from('user_organizations')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('organization_id', membership.organization_id)

      if (error) {
        console.error('Error removing user:', error)
        setError('Fehler beim Entfernen des Benutzers')
        return
      }

      setSuccess('Benutzer erfolgreich entfernt')
      await loadUsers()

    } catch (error) {
      console.error('Error removing user:', error)
      setError('Fehler beim Entfernen des Benutzers')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Eigentümer'
      case 'admin': return 'Administrator'
      case 'member': return 'Mitglied'
      default: return role
    }
  }

  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Keine Berechtigung
                </h2>
                <p className="text-gray-600">
                  Sie haben keine Berechtigung für die Benutzerverwaltung.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
            <p className="text-gray-600 mt-2">Verwalten Sie Benutzer und Einladungen in Ihrer Organisation</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
              {success}
            </div>
          )}

          {/* Invite User Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Benutzer einladen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendInvitation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="benutzer@beispiel.de"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rolle</Label>
                    <select
                      id="role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                      <option value="member">Mitglied</option>
                      {userRole === 'owner' && <option value="admin">Administrator</option>}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={isInviting} className="w-full">
                      {isInviting ? 'Wird gesendet...' : 'Einladung senden'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Users */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Team-Mitglieder ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || user.email}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            {getRoleLabel(user.role)} • Seit {new Date(user.joined_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {getRoleLabel(user.role)}
                        </span>
                        {user.id !== user?.id && userRole === 'owner' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ausstehende Einladungen ({invitations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            {getRoleLabel(invitation.role)} • Läuft ab {new Date(invitation.expires_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-yellow-600">Ausstehend</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
