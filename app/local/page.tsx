"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LocalDashboard } from "../dashboard/local-dashboard"
import { setUser, getUser } from "@/lib/localStorage"

export default function LocalPage() {
  const [user, setUserState] = useState(getUser())
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const handleLogin = () => {
    if (!name.trim() || !email.trim()) return
    
    setUser({ name: name.trim(), email: email.trim() })
    setUserState(getUser())
  }

  const handleLogout = () => {
    localStorage.removeItem('easytasks_user')
    setUserState(null)
  }

  if (user) {
    return (
      <div>
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-sm text-blue-800">
              Angemeldet als: {user.name} ({user.email})
            </span>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Abmelden
            </Button>
          </div>
        </div>
        <LocalDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Easy Tasks - Lokale Version
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Keine Anmeldung erforderlich - alles wird lokal gespeichert
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ihr Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={!name.trim() || !email.trim()}
            >
              Starten
            </Button>
            <div className="text-center text-xs text-gray-500">
              Alle Daten werden nur in Ihrem Browser gespeichert
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
