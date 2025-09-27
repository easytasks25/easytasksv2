# Easy Tasks

Eine produktionsreife Aufgabenverwaltung für Bauunternehmen, entwickelt mit Next.js 14, TypeScript und Prisma.

## Features

- **Aufgabenverwaltung**: Erstellen, bearbeiten und verwalten von Tasks
- **Tagesplanung**: Drag & Drop zwischen Buckets (Heute, Morgen, Backlog)
- **Dashboard**: Übersicht über offene/erledigte Aufgaben und Statistiken
- **Organisationen**: Multi-Tenant-System mit Rollenbasierter Zugriffskontrolle
- **Suche & Filter**: Durchsuchen von Tasks und Ausblenden erledigter Aufgaben
- **Responsive Design**: Optimiert für Desktop und Mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Sprache**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Datenbank**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentifizierung**: NextAuth v4 (Credentials)
- **Drag & Drop**: react-beautiful-dnd

## Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd easy-tasks
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment Variablen konfigurieren

Kopieren Sie `env.example` zu `.env.local` und füllen Sie die Werte aus:

```bash
cp env.example .env.local
```

**Wichtige Variablen:**
- `NEXTAUTH_SECRET`: Zufälliger String für JWT-Signierung
- `NEXTAUTH_URL`: URL der Anwendung (nur in Production setzen!)
- `DATABASE_URL`: Supabase Pooler-URL (Port 6543)
- `DIRECT_URL`: Supabase Direct-URL (Port 5432)

### 4. Datenbank einrichten

#### Supabase Setup:
1. Neues Projekt in Supabase erstellen
2. Database URL und Direct URL aus den Einstellungen kopieren
3. In `.env.local` eintragen

#### Migrationen ausführen:
```bash
npm run prisma:migrate
```

### 5. Demo-Daten laden (optional)

```bash
SEED_DEMO=true npm run seed
```

Demo-Login: `demo@easy-tasks.de` / `demo123`

### 6. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## Deployment

### Vercel

1. Repository mit Vercel verbinden
2. Environment Variablen in Vercel setzen:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (nur in Production!)
   - `DATABASE_URL`
   - `DIRECT_URL`

**Wichtig**: `NEXTAUTH_URL` nur in Production setzen, nicht in Preview-Builds!

### Migrationen

Migrationen werden **nicht** automatisch im Build ausgeführt. Führen Sie sie manuell aus:

```bash
npm run prisma:deploy
```

## Projektstruktur

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentifizierung
│   ├── dashboard/         # Dashboard
│   └── organizations/     # Organisationen
├── components/            # UI Komponenten
├── lib/                   # Utilities & Konfiguration
├── prisma/                # Datenbankschema & Migrationen
└── public/                # Statische Assets
```

## API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/signin` - Anmelden (NextAuth)

### Health Checks
- `GET /api/health/db` - Pooler-Verbindung testen
- `GET /api/health/db-direct` - Direct-Verbindung testen

### Daten
- `GET /api/dashboard` - Dashboard-Statistiken
- `GET /api/tasks` - Tasks abrufen
- `POST /api/tasks` - Task erstellen
- `PATCH /api/tasks/[id]` - Task aktualisieren
- `GET /api/buckets` - Buckets abrufen
- `POST /api/buckets` - Bucket erstellen

## Datenmodell

### User
- Registrierung erstellt automatisch Organisation + Membership
- Passwort wird mit bcrypt gehashed

### Organisation
- Multi-Tenant-System
- Typen: `company`, `team`
- Jeder User kann Owner einer Organisation sein

### Tasks
- Status: `open`, `done`
- Priorität: `low`, `med`, `high`
- Zugehörigkeit zu Buckets und Projekten

### Buckets
- Standard: "Heute", "Morgen", "Backlog"
- Custom Buckets möglich
- Drag & Drop zwischen Buckets

## Sicherheit

- **NextAuth v4**: JWT-basierte Sessions
- **Middleware**: Route Guards für geschützte Bereiche
- **RBAC**: Rollenbasierte Zugriffskontrolle
- **Prisma**: Sichere Datenbankabfragen
- **bcrypt**: Passwort-Hashing

## Entwicklung

### Nützliche Commands

```bash
# Entwicklung
npm run dev

# Build
npm run build

# Prisma
npm run prisma:migrate    # Migration erstellen
npm run prisma:deploy     # Migration anwenden
npm run prisma:studio     # Prisma Studio öffnen

# Seed
npm run seed              # Demo-Daten laden
```

### Code-Standards

- **TypeScript**: Strikte Typisierung
- **ESLint**: Code-Qualität
- **Prettier**: Code-Formatierung
- **Server Components**: Bevorzugt vor Client Components
- **Server Actions**: Für Datenbankoperationen

## Troubleshooting

### Häufige Probleme

1. **NEXTAUTH_URL Fehler**: Nur in Production setzen, nicht in Preview
2. **Database Connection**: Prüfen Sie DATABASE_URL und DIRECT_URL
3. **Migration Fehler**: Verwenden Sie DIRECT_URL für Migrationen
4. **Session Probleme**: Prüfen Sie NEXTAUTH_SECRET

### Logs

```bash
# Vercel Logs
vercel logs

# Lokale Logs
npm run dev
```

## Lizenz

Proprietär - Lück & Wahlen Baugesellschaft GmbH & CoKG
