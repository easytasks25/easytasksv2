// Local Storage utilities for tasks and buckets
export interface LocalTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'med' | 'high';
  status: 'open' | 'done';
  dueDate?: string;
  bucketId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalBucket {
  id: string;
  name: string;
  type: 'day' | 'custom';
  color: string;
  orderIndex: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  TASKS: 'easytasks_tasks',
  BUCKETS: 'easytasks_buckets',
  USER: 'easytasks_user'
};

// User Management
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: { name: string; email: string }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
    ...user,
    id: 'local-user',
    createdAt: new Date().toISOString()
  }));
};

// Bucket Management
export const getBuckets = (): LocalBucket[] => {
  if (typeof window === 'undefined') return getDefaultBuckets();
  const buckets = localStorage.getItem(STORAGE_KEYS.BUCKETS);
  if (!buckets) {
    const defaultBuckets = getDefaultBuckets();
    setBuckets(defaultBuckets);
    return defaultBuckets;
  }
  return JSON.parse(buckets);
};

export const setBuckets = (buckets: LocalBucket[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BUCKETS, JSON.stringify(buckets));
};

export const addBucket = (bucket: Omit<LocalBucket, 'id' | 'createdAt'>) => {
  const buckets = getBuckets();
  const newBucket: LocalBucket = {
    ...bucket,
    id: `bucket-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  const updatedBuckets = [...buckets, newBucket];
  setBuckets(updatedBuckets);
  return newBucket;
};

export const updateBucket = (id: string, updates: Partial<LocalBucket>) => {
  const buckets = getBuckets();
  const updatedBuckets = buckets.map(bucket => 
    bucket.id === id ? { ...bucket, ...updates } : bucket
  );
  setBuckets(updatedBuckets);
  return updatedBuckets.find(b => b.id === id);
};

export const deleteBucket = (id: string) => {
  const buckets = getBuckets();
  const updatedBuckets = buckets.filter(bucket => bucket.id !== id);
  setBuckets(updatedBuckets);
  
  // Move tasks from deleted bucket to first bucket
  const tasks = getTasks();
  const firstBucket = updatedBuckets[0];
  if (firstBucket) {
    const updatedTasks = tasks.map(task => 
      task.bucketId === id ? { ...task, bucketId: firstBucket.id } : task
    );
    setTasks(updatedTasks);
  }
};

// Task Management
export const getTasks = (): LocalTask[] => {
  if (typeof window === 'undefined') return [];
  const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
  return tasks ? JSON.parse(tasks) : [];
};

export const setTasks = (tasks: LocalTask[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const addTask = (task: Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt'>) => {
  const tasks = getTasks();
  const newTask: LocalTask = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updatedTasks = [...tasks, newTask];
  setTasks(updatedTasks);
  return newTask;
};

export const updateTask = (id: string, updates: Partial<LocalTask>) => {
  const tasks = getTasks();
  const updatedTasks = tasks.map(task => 
    task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
  );
  setTasks(updatedTasks);
  return updatedTasks.find(t => t.id === id);
};

export const deleteTask = (id: string) => {
  const tasks = getTasks();
  const updatedTasks = tasks.filter(task => task.id !== id);
  setTasks(updatedTasks);
};

export const moveTask = (taskId: string, newBucketId: string) => {
  return updateTask(taskId, { bucketId: newBucketId });
};

// Default buckets
const getDefaultBuckets = (): LocalBucket[] => [
  {
    id: 'bucket-heute',
    name: 'Heute',
    type: 'day',
    color: '#fef3c7',
    orderIndex: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bucket-morgen',
    name: 'Morgen',
    type: 'day',
    color: '#dbeafe',
    orderIndex: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bucket-backlog',
    name: 'Backlog',
    type: 'custom',
    color: '#e5efe9',
    orderIndex: 3,
    createdAt: new Date().toISOString()
  }
];

// Statistics
export const getStats = () => {
  const tasks = getTasks();
  const buckets = getBuckets();
  
  return {
    totalTasks: tasks.length,
    openTasks: tasks.filter(t => t.status === 'open').length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    todayTasks: tasks.filter(t => {
      if (!t.dueDate) return false;
      const today = new Date().toDateString();
      return new Date(t.dueDate).toDateString() === today;
    }).length,
    overdueTasks: tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
    bucketsCount: buckets.length
  };
};
