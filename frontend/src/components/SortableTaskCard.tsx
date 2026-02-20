import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../types/task.types';

interface SortableTaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  getStatusBadgeClass: (status: TaskStatus) => string;
  getPriorityBadgeClass: (priority: string) => string;
  formatDate: (date: Date | undefined) => string;
  isCompleted?: boolean;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  formatDate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''} ${isCompleted ? 'completed-task' : ''}`}
      {...attributes}
    >
      <div className="drag-handle" {...listeners}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ opacity: 0.5 }}
        >
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </div>

      <div className="task-header">
        <h3>{task.title}</h3>
        <div className="task-badges">
          <span className={`badge ${getStatusBadgeClass(task.status)}`}>
            {task.status}
          </span>
          <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <p className="task-description">{task.description}</p>

      <div className="task-meta">
        <span className="due-date">📅 {formatDate(task.dueDate)}</span>
      </div>

      <div className="task-actions">
        <button 
          className={`btn ${isCompleted ? 'btn-reopen' : 'btn-edit'}`} 
          onClick={onEdit}
          title={isCompleted ? 'Reopen task for editing' : 'Edit task'}
        >
          {isCompleted ? '🔄 Reopen' : 'Edit'}
        </button>
        <button className="btn btn-delete" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default SortableTaskCard;
