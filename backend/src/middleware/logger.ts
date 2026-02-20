import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

// Custom token for execution time
morgan.token('execution-time', (req: Request, res: Response) => {
  const start = res.locals.startTime as number;
  if (start) {
    const duration = Date.now() - start;
    return `${duration}ms`;
  }
  return '0ms';
});

// Custom format: [METHOD] /endpoint - Execution time: Xms
export const requestLogger = morgan((tokens, req: Request, res: Response) => {
  return [
    `[${tokens.method(req, res)}]`,
    tokens.url(req, res),
    '- Execution time:',
    tokens['execution-time'](req, res),
  ].join(' ');
});

// Middleware to track request start time
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  res.locals.startTime = Date.now();
  next();
};
