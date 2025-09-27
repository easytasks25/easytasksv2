# Supabase Integration Setup

Diese Anleitung beschreibt, wie Sie die Supabase-Integration in Ihrer Next.js-App einrichten.

## 1. Supabase-Projekt einrichten

1. Gehen Sie zu [supabase.com](https://supabase.com) und melden Sie sich an
2. Erstellen Sie ein neues Projekt oder verwenden Sie das bestehende Projekt
3. Notieren Sie sich die Projekt-URL und API-Keys

## 2. Datenbank-Schema erstellen

Führen Sie das SQL-Skript `supabase/schema.sql` in Ihrem Supabase-Dashboard aus:

1. Gehen Sie zu Ihrem Supabase-Projekt
2. Navigieren Sie zu "SQL Editor"
3. Kopieren Sie den Inhalt von `supabase/schema.sql`
4. Führen Sie das Skript aus

## 3. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env.local`-Datei im Projektverzeichnis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ngpsgfwmowxtkjivdyhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHNnZndtb3d4dGtqaXZkeWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODM3MDEsImV4cCI6MjA3NDU1OTcwMX0.dIfz3rEt-UJNTj_XHLjgDC3tVieS6ZGT7piThpSUpS4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHNnZndtb3d4dGtqaXZkeWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk4MzcwMSwiZXhwIjoyMDc0NTU5NzAxfQ.KIaXNl2ABA_jmgf5-EMpdMiiw3ti25oU0E52GgJBCe4
```

## 4. Supabase-Pakete installieren

```bash
npm install @supabase/supabase-js
```

## 5. Authentifizierung konfigurieren

Die App verwendet jetzt Supabase Auth anstelle von NextAuth. Die wichtigsten Komponenten:

- `contexts/AuthContext.tsx` - Authentifizierungskontext
- `components/ProtectedRoute.tsx` - Geschützte Routen
- `app/auth/` - Authentifizierungsseiten

## 6. Datenbank-Typen

Die TypeScript-Typen sind in `types/supabase.ts` definiert und entsprechen der Datenbankstruktur.

## 7. Row Level Security (RLS)

Alle Tabellen haben RLS-Policies aktiviert, die sicherstellen, dass Benutzer nur auf ihre eigenen Daten zugreifen können.

## 8. Features

- ✅ E-Mail/Passwort-Registrierung
- ✅ E-Mail/Passwort-Anmeldung
- ✅ Passwort zurücksetzen
- ✅ Geschützte Routen
- ✅ Automatische Profilerstellung
- ✅ Organisationen und Projekte
- ✅ Tasks und Buckets
- ✅ Row Level Security

## 9. Nächste Schritte

1. Führen Sie das SQL-Skript in Supabase aus
2. Installieren Sie die Supabase-Pakete
3. Konfigurieren Sie die Umgebungsvariablen
4. Starten Sie die Anwendung

## 10. Migration von NextAuth

Die App wurde von NextAuth zu Supabase Auth migriert. Die bestehenden UI-Komponenten bleiben unverändert, aber die Authentifizierung erfolgt jetzt über Supabase.
