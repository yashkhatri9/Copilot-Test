import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { taskService } from '../services/taskService';
import { storageService } from '../services/storageService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Task, TaskStatus, TaskPriority } from '../types/task.types';
import SortableTaskCard from './SortableTaskCard';
import './TaskList.css';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filterStatus]);

  useEffect(() => {
    if (isOnline) {
      syncPendingOperations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to load tasks';
      if (!isOnline) {
        toast.error('You are offline. Showing cached tasks.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncPendingOperations = async () => {
    const pending = storageService.getPendingOperations();
    if (pending.length === 0) return;

    setSyncing(true);
    try {
      await taskService.syncPendingOperations();
      toast.success(`Synced ${pending.length} pending operation(s)`);
      await loadTasks();
    } catch (err) {
      console.error('Failed to sync pending operations:', err);
    } finally {
      setSyncing(false);
    }
  };

  const applyFilter = () => {
    if (filterStatus === 'ALL') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === filterStatus));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
    const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the filtered tasks
    const reorderedFiltered = arrayMove(filteredTasks, oldIndex, newIndex);
    setFilteredTasks(reorderedFiltered);

    // Update priorities based on new order
    const updatedTasks = reorderedFiltered.map((task, index) => ({
      ...task,
      priority: getPriorityFromIndex(index, reorderedFiltered.length),
    }));

    // Update in all tasks array
    const allTasksUpdated = tasks.map((task) => {
      const updated = updatedTasks.find((t) => t.id === task.id);
      return updated || task;
    });

    setTasks(allTasksUpdated);
    setFilteredTasks(updatedTasks);

    // Persist priority changes
    try {
      const movedTask = updatedTasks[newIndex];
      await taskService.updateTask(movedTask.id, { priority: movedTask.priority });
      
      if (!isOnline) {
        toast.success('Task reordered (will sync when online)');
      } else {
        toast.success('Task reordered successfully');
      }
    } catch (err) {
      toast.error('Failed to update task priority');
    }
  };

  const getPriorityFromIndex = (index: number, total: number): TaskPriority => {
    const ratio = index / Math.max(total - 1, 1);
    if (ratio < 0.33) return TaskPriority.HIGH;
    if (ratio < 0.67) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        await taskService.deleteTask(id);
        
        if (!isOnline) {
          toast.success('Task deleted (will sync when online)');
        } else {
          toast.success('Task deleted successfully');
        }
        
        loadTasks();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 'Failed to delete task';
        
        if (!isOnline) {
          toast.error('Deleted locally, will sync when online');
        } else {
          toast.error(errorMessage);
        }
        setLoading(false);
      }
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await taskService.updateTask(id, { status: TaskStatus.TODO });
      toast.success('Task reopened');
      loadTasks();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reopen task';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (task: Task) => {
    if (task.status === TaskStatus.COMPLETED) {
      const confirmed = window.confirm(
        'This task is marked as completed. Do you want to reopen it for editing?'
      );
      if (confirmed) {
        handleReopen(task.id);
      }
    } else {
      navigate(`/tasks/edit/${task.id}`);
    }
  };

  const getStatusBadgeClass = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'badge-todo';
      case TaskStatus.IN_PROGRESS:
        return 'badge-in-progress';
      case TaskStatus.COMPLETED:
        return 'badge-completed';
      default:
        return '';
    }
  };

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'LOW':
        return 'badge-priority-low';
      case 'MEDIUM':
        return 'badge-priority-medium';
      case 'HIGH':
        return 'badge-priority-high';
      default:
        return '';
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  };

  const pendingCount = storageService.getPendingOperations().length;

  return (
    <div className="task-list-container">
      <div className="header">
        <h1>Task Management</h1>
        <div className="header-actions">
          {/* Sync Status Indicator */}
          <div className={`sync-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {syncing ? (
                'Syncing...'
              ) : isOnline ? (
                pendingCount > 0 ? `${pendingCount} pending` : 'Online'
              ) : (
                'Offline'
              )}
            </span>
          </div>
          
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            + Create New Task
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">All Tasks</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        
        {!isOnline && (
          <div className="offline-banner">
            📡 You're offline. Changes will sync when connection is restored.
          </div>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <div className="empty-state">
          <p>No tasks found. Create your first task!</p>
        </div>
      )}

      {!loading && filteredTasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => handleEdit(task)}
                  onDelete={() => handleDelete(task.id)}
                  getStatusBadgeClass={getStatusBadgeClass}
                  getPriorityBadgeClass={getPriorityBadgeClass}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default TaskList;
