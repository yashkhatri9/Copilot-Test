import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { taskService } from '../services/taskService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import './TaskForm.css';

const TaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      loadTask(id);
    }
  }, [isEditMode, id]);

  const loadTask = async (taskId: string) => {
    setLoading(true);
    try {
      const task = await taskService.getTaskById(taskId);
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to load task';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }

    if (title.length < 3) {
      toast.error('Title must be at least 3 characters');
      return false;
    }

    if (title.length > 200) {
      toast.error('Title must not exceed 200 characters');
      return false;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return false;
    }

    if (description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }

    if (description.length > 1000) {
      toast.error('Description must not exceed 1000 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && id) {
        const updateData: UpdateTaskDto = {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate || undefined,
        };
        await taskService.updateTask(id, updateData);
        
        if (!isOnline) {
          toast.success('Task updated (will sync when online)');
        } else {
          toast.success('Task updated successfully');
        }
      } else {
        const createData: CreateTaskDto = {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate || undefined,
        };
        await taskService.createTask(createData);
        
        if (!isOnline) {
          toast.success('Task created (will sync when online)');
        } else {
          toast.success('Task created successfully');
        }
      }
      navigate('/tasks');
    } catch (err: any) {
      // Handle validation errors from backend
      const errorData = err.response?.data?.error;
      if (errorData?.details && Array.isArray(errorData.details)) {
        // Show detailed field errors
        errorData.details.forEach((detail: any) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        // Show general error message
        const errorMessage = errorData?.message || `Failed to ${isEditMode ? 'update' : 'create'} task`;
        
        if (!isOnline) {
          toast.error('Saved locally, will sync when online');
        } else {
          toast.error(errorMessage);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Task' : 'Create New Task'}</h1>
        {!isOnline && (
          <div className="offline-indicator">
            📡 Offline Mode
          </div>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading task...</p>
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              placeholder="Enter task title"
              maxLength={200}
              required
            />
            <small className="form-text">{title.length}/200 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              rows={5}
              placeholder="Enter task description"
              maxLength={1000}
              required
            />
            <small className="form-text">{description.length}/1000 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="form-control"
              >
                {Object.values(TaskStatus).map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="form-control"
              >
                {Object.values(TaskPriority).map((priorityOption) => (
                  <option key={priorityOption} value={priorityOption}>
                    {priorityOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tasks')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="button-spinner"></span>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Task' : 'Create Task'}</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
