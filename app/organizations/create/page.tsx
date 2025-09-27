"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateOrganizationPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!user) {
      setError("Sie müssen angemeldet sein")
      setIsLoading(false)
      return
    }

    try {
      // Erstelle Organisation
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          description: description || null,
          type: 'team',
          created_by: user.id
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError)
        setError("Organisation konnte nicht erstellt werden")
        return
      }

      // Füge User als Owner zur Organisation hinzu
      const { error: membershipError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          role: 'owner',
          is_active: true
        })

      if (membershipError) {
        console.error('Membership creation error:', membershipError)
        setError("Fehler beim Hinzufügen zur Organisation")
        return
      }

      router.push("/dashboard")
    } catch (error) {
      console.error('Create organization error:', error)
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Organisation erstellen
          </CardTitle>
          <CardDescription className="text-center">
            Erstellen Sie Ihre erste Organisation oder Ihr Team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organisationsname</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mein Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung Ihrer Organisation"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wird erstellt..." : "Organisation erstellen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
