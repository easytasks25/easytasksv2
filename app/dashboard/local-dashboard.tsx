"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Search, CheckCircle, Circle, Clock, AlertTriangle, Calendar, Settings } from "lucide-react"
import { 
  getBuckets, 
  getTasks, 
  addTask, 
  updateTask, 
  moveTask, 
  addBucket, 
  updateBucket, 
  deleteBucket,
  getStats,
  LocalTask,
  LocalBucket
} from "@/lib/localStorage"

export function LocalDashboard() {
  const [buckets, setBuckets] = useState<LocalBucket[]>([])
  const [tasks, setTasks] = useState<LocalTask[]>([])
  const [stats, setStats] = useState(getStats())
  const [searchTerm, setSearchTerm] = useState("")
  const [hideCompleted, setHideCompleted] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newBucketName, setNewBucketName] = useState("")
  const [newBucketColor, setNewBucketColor] = useState("#e5e7eb")

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const loadedBuckets = getBuckets()
    const loadedTasks = getTasks()
    const loadedStats = getStats()
    
    setBuckets(loadedBuckets)
    setTasks(loadedTasks)
    setStats(loadedStats)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Find the task
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    // Find the buckets
    const sourceBucket = buckets.find(b => b.id === source.droppableId)
    const destBucket = buckets.find(b => b.id === destination.droppableId)

    if (!sourceBucket || !destBucket) return

    // Move task in localStorage
    moveTask(task.id, destBucket.id)

    // Update local state
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === task.id ? { ...t, bucketId: destBucket.id } : t
      )
    )
  }

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'done' : 'open'
    
    updateTask(taskId, { status: newStatus })
    
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    )

    // Update stats
    setStats(getStats())
  }

  const addNewTask = (bucketId: string) => {
    const title = prompt("Task-Titel eingeben:")
    if (!title) return

    const newTask = addTask({
      title,
      description: '',
      priority: 'med',
      status: 'open',
      bucketId
    })

    setTasks(prevTasks => [newTask, ...prevTasks])
    setStats(getStats())
  }

  const addNewBucket = () => {
    if (!newBucketName.trim()) return

    const newBucket = addBucket({
      name: newBucketName,
      type: 'custom',
      color: newBucketColor,
      orderIndex: buckets.length + 1
    })

    setBuckets(prevBuckets => [...prevBuckets, newBucket])
    setNewBucketName("")
    setNewBucketColor("#e5e7eb")
    setShowSettings(false)
  }

  const deleteBucketById = (bucketId: string) => {
    if (confirm("Bucket wirklich löschen? Alle Tasks werden in den ersten Bucket verschoben.")) {
      deleteBucket(bucketId)
      loadData() // Reload all data
    }
  }

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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = hideCompleted ? task.status === 'open' : true
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Easy Tasks</h1>
              <p className="text-sm text-gray-600">Lokale Version</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Kalender
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
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
              <AlertTriangle className="h-4 w-4 text-red-600" />
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

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Neuen Bucket erstellen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Bucket-Name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                />
                <Input
                  type="color"
                  value={newBucketColor}
                  onChange={(e) => setNewBucketColor(e.target.value)}
                  className="w-20"
                />
                <Button onClick={addNewBucket}>Hinzufügen</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {showCalendar && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kalender-Ansicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Kalender-Feature wird implementiert...
              </div>
            </CardContent>
          </Card>
        )}

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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addNewTask(bucket.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {bucket.type === 'custom' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBucketById(bucket.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {tasks.filter(t => t.bucketId === bucket.id).length} Tasks
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
                      {tasks
                        .filter(task => {
                          const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesStatus = hideCompleted ? task.status === 'open' : true
                          const matchesBucket = task.bucketId === bucket.id
                          return matchesSearch && matchesStatus && matchesBucket
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
