import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Guard: Nur ausführen wenn SEED_DEMO=true
  if (process.env.SEED_DEMO !== 'true') {
    console.log('Seed übersprungen - SEED_DEMO nicht auf true gesetzt')
    process.exit(0)
  }

  console.log('Starte Demo-Seed...')

  // Demo User erstellen
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@easy-tasks.de' },
    update: {},
    create: {
      email: 'demo@easy-tasks.de',
      name: 'Demo Benutzer',
      password: hashedPassword,
    },
  })

  // Demo Organisation erstellen
  const demoOrg = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'Demo Bauunternehmen',
      type: 'company',
      description: 'Demo-Organisation für Easy Tasks',
      createdById: demoUser.id,
    },
  })

  // Demo Membership erstellen
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      role: 'owner',
    },
  })

  // Demo Buckets erstellen
  const todayBucket = await prisma.bucket.upsert({
    where: { id: 'demo-bucket-today' },
    update: {},
    create: {
      id: 'demo-bucket-today',
      name: 'Heute',
      type: 'day',
      color: '#fef3c7',
      order: 1,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
  })

  const tomorrowBucket = await prisma.bucket.upsert({
    where: { id: 'demo-bucket-tomorrow' },
    update: {},
    create: {
      id: 'demo-bucket-tomorrow',
      name: 'Morgen',
      type: 'day',
      color: '#dbeafe',
      order: 2,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
  })

  const backlogBucket = await prisma.bucket.upsert({
    where: { id: 'demo-bucket-backlog' },
    update: {},
    create: {
      id: 'demo-bucket-backlog',
      name: 'Backlog',
      type: 'custom',
      color: '#e5efe9',
      order: 3,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
  })

  // Demo Tasks erstellen
  const demoTasks = [
    {
      id: 'demo-task-1',
      title: 'Baustellenbesichtigung',
      description: 'Wöchentliche Baustellenbesichtigung durchführen',
      priority: 'high',
      status: 'open',
      bucketId: todayBucket.id,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
    {
      id: 'demo-task-2',
      title: 'Material bestellen',
      description: 'Zement und Stahl für nächste Woche bestellen',
      priority: 'med',
      status: 'open',
      bucketId: tomorrowBucket.id,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
    {
      id: 'demo-task-3',
      title: 'Terminplanung Q2',
      description: 'Terminplanung für das zweite Quartal erstellen',
      priority: 'low',
      status: 'open',
      bucketId: backlogBucket.id,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
    {
      id: 'demo-task-4',
      title: 'Sicherheitsunterweisung',
      description: 'Neue Mitarbeiter einweisen',
      priority: 'high',
      status: 'done',
      completedAt: new Date(),
      completedBy: demoUser.id,
      userId: demoUser.id,
      organizationId: demoOrg.id,
    },
  ]

  for (const taskData of demoTasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {},
      create: taskData,
    })
  }

  console.log('Demo-Seed erfolgreich abgeschlossen!')
  console.log('Demo-Login: demo@easy-tasks.de / demo123')
}

main()
  .catch((e) => {
    console.error('Fehler beim Seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
