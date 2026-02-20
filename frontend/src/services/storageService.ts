import { Task } from '../types/task.types';

const TASKS_STORAGE_KEY = 'taskManagerPro_tasks';
const PENDING_SYNC_KEY = 'taskManagerPro_pendingSync';
const LAST_SYNC_KEY = 'taskManagerPro_lastSync';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: number;
}

class StorageService {
  // Get tasks from localStorage
  getTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('Error reading tasks from localStorage:', error);
      return [];
    }
  }

  // Save tasks to localStorage
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  // Get pending sync operations
  getPendingOperations(): PendingOperation[] {
    try {
      const pendingJson = localStorage.getItem(PENDING_SYNC_KEY);
      return pendingJson ? JSON.parse(pendingJson) : [];
    } catch (error) {
      console.error('Error reading pending operations:', error);
      return [];
    }
  }

  // Add a pending operation
  addPendingOperation(operation: Omit<PendingOperation, 'timestamp'>): void {
    try {
      const pending = this.getPendingOperations();
      pending.push({
        ...operation,
        timestamp: Date.now(),
      });
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending operation:', error);
    }
  }

  // Clear pending operations
  clearPendingOperations(): void {
    try {
      localStorage.removeItem(PENDING_SYNC_KEY);
    } catch (error) {
      console.error('Error clearing pending operations:', error);
    }
  }

  // Remove a specific pending operation
  removePendingOperation(id: string): void {
    try {
      const pending = this.getPendingOperations();
      const filtered = pending.filter(op => op.id !== id);
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending operation:', error);
    }
  }

  // Get last sync time
  getLastSyncTime(): Date | null {
    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error reading last sync time:', error);
      return null;
    }
  }

  // Clear all data
  clearAll(): void {
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
      localStorage.removeItem(PENDING_SYNC_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();
