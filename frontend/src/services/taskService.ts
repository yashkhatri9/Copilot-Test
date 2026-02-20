import axios from 'axios';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import { storageService } from './storageService';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await api.get<{ data: Task[] }>('/tasks');
      const tasks = response.data.data;
      // Cache in localStorage
      storageService.saveTasks(tasks);
      return tasks;
    } catch (error) {
      // If offline or error, return cached tasks
      console.warn('Failed to fetch tasks from API, using cached data:', error);
      return storageService.getTasks();
    }
  },

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await api.get<{ data: Task }>(`/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      // Try to find in cached tasks
      const cachedTasks = storageService.getTasks();
      const task = cachedTasks.find(t => t.id === id);
      if (task) {
        return task;
      }
      throw error;
    }
  },

  async createTask(task: CreateTaskDto): Promise<Task> {
    try {
      const response = await api.post<{ data: Task }>('/tasks', task);
      const newTask = response.data.data;
      
      // Update cache
      const cachedTasks = storageService.getTasks();
      storageService.saveTasks([...cachedTasks, newTask]);
      
      return newTask;
    } catch (error) {
      // Queue for sync when online
      const tempId = `temp_${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        ...task,
        status: task.status || 'TODO' as any,
        priority: task.priority || 'MEDIUM' as any,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add to cache
      const cachedTasks = storageService.getTasks();
      storageService.saveTasks([...cachedTasks, tempTask]);
      
      // Queue for sync
      storageService.addPendingOperation({
        id: tempId,
        type: 'create',
        data: task,
      });
      
      throw error;
    }
  },

  async updateTask(id: string, task: UpdateTaskDto): Promise<Task> {
    try {
      const response = await api.put<{ data: Task }>(`/tasks/${id}`, task);
      const updatedTask = response.data.data;
      
      // Update cache
      const cachedTasks = storageService.getTasks();
      const taskIndex = cachedTasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        cachedTasks[taskIndex] = updatedTask;
        storageService.saveTasks(cachedTasks);
      }
      
      return updatedTask;
    } catch (error) {
      // Update cache optimistically
      const cachedTasks = storageService.getTasks();
      const taskIndex = cachedTasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        cachedTasks[taskIndex] = {
          ...cachedTasks[taskIndex],
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : cachedTasks[taskIndex].dueDate,
          updatedAt: new Date(),
        };
        storageService.saveTasks(cachedTasks);
      }
      
      // Queue for sync
      storageService.addPendingOperation({
        id,
        type: 'update',
        data: task,
      });
      
      throw error;
    }
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/tasks/${id}`);
      
      // Remove from cache
      const cachedTasks = storageService.getTasks();
      storageService.saveTasks(cachedTasks.filter(t => t.id !== id));
      
      return response.data;
    } catch (error) {
      // Remove from cache optimistically
      const cachedTasks = storageService.getTasks();
      storageService.saveTasks(cachedTasks.filter(t => t.id !== id));
      
      // Queue for sync
      storageService.addPendingOperation({
        id,
        type: 'delete',
      });
      
      throw error;
    }
  },

  async syncPendingOperations(): Promise<void> {
    const pending = storageService.getPendingOperations();
    
    for (const operation of pending) {
      try {
        switch (operation.type) {
          case 'create':
            await api.post('/tasks', operation.data);
            break;
          case 'update':
            await api.put(`/tasks/${operation.id}`, operation.data);
            break;
          case 'delete':
            await api.delete(`/tasks/${operation.id}`);
            break;
        }
        
        // Remove from pending if successful
        storageService.removePendingOperation(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        // Keep in pending queue
      }
    }
    
    // Refresh tasks after sync
    if (pending.length > 0) {
      const response = await api.get<{ data: Task[] }>('/tasks');
      storageService.saveTasks(response.data.data);
    }
  },
};
