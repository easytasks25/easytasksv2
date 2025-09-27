"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, XCircle } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  role: string
  organization: {
    id: string
    name: string
  }
  expires_at: string
}

function AcceptInvitationForm() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      loadInvitation(token)
    }
  }, [searchParams])

  const loadInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        setError('Einladung nicht gefunden oder abgelaufen')
        return
      }

      setInvitation({
        id: data.id,
        email: data.email,
        role: data.role,
        organization: data.organizations,
        expires_at: data.expires_at
      })
    } catch (error) {
      console.error('Error loading invitation:', error)
      setError('Fehler beim Laden der Einladung')
    }
  }

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    try {
      // Sign up the user
      const { error: signUpError } = await signUp(
        invitation.email,
        password,
        name,
        invitation.organization.name,
        'team' // Default type for invited users
      )

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        // Don't fail the signup for this
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Fehler beim Akzeptieren der Einladung')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Einladung angenommen!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ihr Konto wurde erfolgreich erstellt. Sie können sich jetzt anmelden.
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Zur Anmeldung
          </Button>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Einladung nicht gefunden
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Diese Einladung ist ungültig oder abgelaufen.
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Zur Anmeldung
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Einladung annehmen
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Sie wurden zu <strong>{invitation.organization.name}</strong> eingeladen
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ihr Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mindestens 6 Zeichen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md text-sm">
              <strong>Rolle:</strong> {invitation.role === 'admin' ? 'Administrator' : 'Mitglied'}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Einladung annehmen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <AcceptInvitationForm />
    </Suspense>
  )
}
