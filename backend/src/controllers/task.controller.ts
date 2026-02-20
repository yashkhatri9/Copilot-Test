import { Request, Response, NextFunction } from 'express';
import { taskStore, CreateTaskDto, UpdateTaskDto } from '../models/task.model';

interface CustomError extends Error {
  statusCode?: number;
}

export const getAllTasks = (req: Request, res: Response): void => {
  const tasks = taskStore.findAll();
  res.status(200).json({ data: tasks });
};

export const getTaskById = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  const task = taskStore.findById(id);

  if (!task) {
    const error: CustomError = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ data: task });
};

export const createTask = (req: Request, res: Response, next: NextFunction): void => {
  // Validation is handled by middleware, so we can trust the data
  const taskData: CreateTaskDto = req.body;

  try {
    const task = taskStore.create(taskData);
    res.status(201).json({ data: task });
  } catch (err) {
    const error: CustomError = new Error('Failed to create task');
    error.statusCode = 500;
    next(error);
  }
};

export const updateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  const updateData: UpdateTaskDto = req.body;

  // Check if task exists
  const existingTask = taskStore.findById(id);
  if (!existingTask) {
    const error: CustomError = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  // Prevent editing completed tasks unless status is being changed
  if (existingTask.status === 'COMPLETED' && updateData.status !== 'COMPLETED') {
    // Allowing status change from COMPLETED to another status (reopening task)
    // This is permitted
  } else if (existingTask.status === 'COMPLETED' && 
             (!updateData.status || updateData.status === 'COMPLETED')) {
    // Trying to edit a completed task without changing status
    const error: CustomError = new Error(
      'Cannot edit a completed task. Please reopen the task first by changing its status.'
    );
    error.statusCode = 400;
    return next(error);
  }

  try {
    const updatedTask = taskStore.update(id, updateData);
    res.status(200).json({ data: updatedTask });
  } catch (err) {
    const error: CustomError = new Error('Failed to update task');
    error.statusCode = 500;
    next(error);
  }
};

export const deleteTask = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  const task = taskStore.findById(id);
  if (!task) {
    const error: CustomError = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  const deleted = taskStore.delete(id);
  if (deleted) {
    res.status(200).json({ message: 'Task deleted successfully' });
  } else {
    const error: CustomError = new Error('Failed to delete task');
    error.statusCode = 500;
    next(error);
  }
};
