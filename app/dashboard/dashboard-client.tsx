"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Search, LogOut, CheckCircle, Circle, Clock, AlertTriangle, Users } from "lucide-react"
import { Prisma } from "@prisma/client"

type UserSlim = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type TaskWithRels = Prisma.TaskGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    bucket: true;
    project: true;
  };
}>;

type BucketWithTasks = Prisma.BucketGetPayload<{
  include: {
    tasks: {
      include: {
        user: { select: { id: true; name: true; email: true } };
        bucket: true;
        project: true;
      };
    };
  };
}>;

interface DashboardStats {
  totalTasks: number
  openTasks: number
  completedTasks: number
  todayTasks: number
  overdueTasks: number
  completedThisWeek: number
  daysSinceOldest: number
  organization: {
    id: string
    name: string
  }
}

export function DashboardClient() {
  const { user, profile, signOut } = useAuth()
  const [buckets, setBuckets] = useState<BucketWithTasks[]>([])
  const [tasks, setTasks] = useState<TaskWithRels[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    todayTasks: 0,
    overdueTasks: 0,
    completedThisWeek: 0,
    daysSinceOldest: 0,
    organization: { id: '', name: '' }
  })
  const [organization, setOrganization] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [userRole, setUserRole] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState("")
  const [hideCompleted, setHideCompleted] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Lade Dashboard-Daten
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Hole User's Organization mit Rolle
      const { data: membership } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!membership || !membership.organizations) {
        // This should not happen anymore since we create default organization on signup
        console.error('No organization found for user')
        setError('Keine Organisation gefunden. Bitte melden Sie sich ab und erneut an.')
        return
      }

      setOrganization({
        id: membership.organization_id,
        name: (membership.organizations as any).name
      })
      setUserRole(membership.role)

      // Hole Buckets mit Tasks
      const { data: bucketsData } = await supabase
        .from('buckets')
        .select(`
          *,
          tasks (
            *,
            user:profiles (
              id,
              name,
              email
            ),
            bucket:buckets (
              id,
              name
            ),
            project:projects (
              id,
              name
            )
          )
        `)
        .eq('organization_id', membership.organization_id)
        .order('order_index', { ascending: true })

      // Hole alle Tasks in der Organisation
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          user:profiles (
            id,
            name,
            email
          ),
          bucket:buckets (
            id,
            name
          ),
          project:projects (
            id,
            name
          )
        `)
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false })

      setBuckets(bucketsData || [])
      setTasks(tasksData || [])

      // Wenn keine Buckets vorhanden sind, erstelle Standard-Buckets
      if (!bucketsData || bucketsData.length === 0) {
        console.log('No buckets found, creating default buckets...')
        await createDefaultBuckets()
        return // loadDashboardData wird nach createDefaultBuckets erneut aufgerufen
      }

      // Berechne Stats
      const totalTasks = tasksData?.length || 0
      const openTasks = tasksData?.filter(t => t.status === 'open').length || 0
      const completedTasks = 0 // TODO: Implement completed tasks query
      const todayTasks = 0 // TODO: Implement today's tasks query
      const overdueTasks = 0 // TODO: Implement overdue tasks query

      setStats({
        totalTasks,
        openTasks,
        completedTasks,
        todayTasks,
        overdueTasks,
        completedThisWeek: 0,
        daysSinceOldest: 0,
        organization: {
          id: membership.organization_id,
          name: (membership.organizations as any).name
        }
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultBuckets = async () => {
    if (!user || !organization.id) return

    try {
      const defaultBuckets = [
        { name: "Heute", type: "day", color: "#fef3c7", order_index: 1 },
        { name: "Morgen", type: "day", color: "#dbeafe", order_index: 2 },
        { name: "Backlog", type: "custom", color: "#e5efe9", order_index: 3 }
      ]

      for (const bucket of defaultBuckets) {
        const { error } = await supabase
          .from('buckets')
          .insert({
            name: bucket.name,
            type: bucket.type,
            color: bucket.color,
            order_index: bucket.order_index,
            user_id: user.id,
            organization_id: organization.id,
            project_id: null
          })

        if (error) {
          console.error("Fehler beim Erstellen des Buckets:", error)
        }
      }

      // Lade Dashboard-Daten neu
      await loadDashboardData()
    } catch (error) {
      console.error("Fehler beim Erstellen der Standard-Buckets:", error)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Finde die Task
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    // Finde die Buckets
    const sourceBucket = buckets.find(b => b.id === source.droppableId)
    const destBucket = buckets.find(b => b.id === destination.droppableId)

    if (!sourceBucket || !destBucket) return

    // Update Task in der Datenbank
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          bucket_id: destBucket.id
        })
        .eq('id', task.id)

      if (error) {
        console.error("Fehler beim Aktualisieren der Task:", error)
        setError("Fehler beim Verschieben der Aufgabe")
        return
      }

      // Update lokalen State
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? { ...t, bucket_id: destBucket.id } : t
        )
      )

      setBuckets(prevBuckets => 
        prevBuckets.map(bucket => {
          if (bucket.id === source.droppableId) {
            return {
              ...bucket,
              tasks: bucket.tasks.filter(t => t.id !== task.id)
            }
          }
          if (bucket.id === destination.droppableId) {
            return {
              ...bucket,
              tasks: [...bucket.tasks, { ...task, bucket_id: destBucket.id }]
            }
          }
          return bucket
        })
      )
    } catch (error) {
      console.error("Fehler beim Verschieben der Task:", error)
    }
  }

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!user) return

    try {
      const newStatus = currentStatus === 'open' ? 'done' : 'open'
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
          completed_by: newStatus === 'done' ? user.id : null
        })
        .eq('id', taskId)

      if (error) {
        console.error("Fehler beim Aktualisieren der Task:", error)
        setError("Fehler beim Aktualisieren der Aufgabe")
        return
      }

      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      )

      // Update buckets with new task status
      setBuckets(prevBuckets =>
        prevBuckets.map(bucket => ({
          ...bucket,
          tasks: bucket.tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        }))
      )

      // Update Stats
      setStats(prevStats => ({
        ...prevStats,
        openTasks: newStatus === 'open' ? prevStats.openTasks + 1 : prevStats.openTasks - 1,
        completedTasks: newStatus === 'done' ? prevStats.completedTasks + 1 : prevStats.completedTasks - 1
      }))
    } catch (error) {
      console.error("Fehler beim Ändern des Task-Status:", error)
      setError("Fehler beim Aktualisieren der Aufgabe")
    }
  }

  const addNewTask = async (bucketId: string) => {
    const title = prompt("Task-Titel eingeben:")
    if (!title || !user || !organization.id) return

    try {
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description: null,
          priority: 'med',
          status: 'open',
          user_id: user.id,
          organization_id: organization.id,
          bucket_id: bucketId,
          project_id: null
        })
        .select(`
          *,
          user:profiles (
            id,
            name,
            email
          ),
          bucket:buckets (
            id,
            name
          ),
          project:projects (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error("Fehler beim Erstellen der Task:", error)
        setError("Fehler beim Erstellen der Aufgabe")
        return
      }

      setTasks(prevTasks => [newTask, ...prevTasks])
      
      setBuckets(prevBuckets => 
        prevBuckets.map(bucket => 
          bucket.id === bucketId 
            ? { ...bucket, tasks: [newTask, ...bucket.tasks] }
            : bucket
        )
      )

      setStats(prevStats => ({
        ...prevStats,
        totalTasks: prevStats.totalTasks + 1,
        openTasks: prevStats.openTasks + 1
      }))
    } catch (error) {
      console.error("Fehler beim Erstellen der Task:", error)
      setError("Fehler beim Erstellen der Aufgabe")
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = hideCompleted ? task.status === 'open' : true
    const matchesUser = userRole === 'owner' || userRole === 'admin' || task.user_id === user?.id
    return matchesSearch && matchesStatus && matchesUser
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'med': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'med': return <Clock className="w-4 h-4" />
      case 'low': return <Circle className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Easy Tasks</h1>
              <p className="text-sm text-gray-600">{organization.name}</p>
            </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Hallo, {profile?.name || user?.email}</span>
                  {(userRole === 'owner' || userRole === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/users'}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Benutzer
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </Button>
                </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Tasks</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heute fällig</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tasks durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hide-completed"
              checked={hideCompleted}
              onCheckedChange={setHideCompleted}
            />
            <Label htmlFor="hide-completed">Erledigte ausblenden</Label>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buckets.map((bucket) => (
              <div key={bucket.id} className="bg-white rounded-lg shadow-sm border">
                <div 
                  className="p-4 border-b"
                  style={{ backgroundColor: bucket.color }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{bucket.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addNewTask(bucket.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {bucket.tasks.length} Tasks
                  </p>
                </div>
                
                <Droppable droppableId={bucket.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 min-h-[400px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {bucket.tasks
                        .filter(task => {
                          const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesStatus = hideCompleted ? task.status === 'open' : true
                          const matchesUser = userRole === 'owner' || userRole === 'admin' || task.user_id === user?.id
                          return matchesSearch && matchesStatus && matchesUser
                        })
                        .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 p-3 bg-white border rounded-lg shadow-sm ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <button
                                      onClick={() => toggleTaskStatus(task.id, task.status)}
                                      className="text-gray-400 hover:text-green-600"
                                    >
                                      {task.status === 'done' ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Circle className="w-4 h-4" />
                                      )}
                                    </button>
                                    <h4 className={`font-medium ${
                                      task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                      {getPriorityIcon(task.priority)}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                      </span>
                                    )}
                                    {(userRole === 'owner' || userRole === 'admin') && task.user && (
                                      <span className="text-xs text-gray-500">
                                        von {task.user.name || task.user.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
