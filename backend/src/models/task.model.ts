export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

// In-memory storage
class TaskStore {
  private tasks: Map<string, Task> = new Map();
  private idCounter: number = 1;

  generateId(): string {
    return `task-${this.idCounter++}`;
  }

  create(taskData: CreateTaskDto): Task {
    const task: Task = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || TaskStatus.TODO,
      priority: taskData.priority || TaskPriority.MEDIUM,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.tasks.set(task.id, task);
    return task;
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(id: string, updateData: UpdateTaskDto): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }

    const updatedTask: Task = {
      ...task,
      title: updateData.title !== undefined ? updateData.title : task.title,
      description: updateData.description !== undefined ? updateData.description : task.description,
      status: updateData.status !== undefined ? updateData.status : task.status,
      priority: updateData.priority !== undefined ? updateData.priority : task.priority,
      dueDate: updateData.dueDate !== undefined ? new Date(updateData.dueDate) : task.dueDate,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
    this.idCounter = 1;
  }
}

export const taskStore = new TaskStore();
