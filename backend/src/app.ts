import express, { Application } from 'express';
import healthRoutes from './routes/health.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';
import { requestLogger, requestTimer } from './middleware/logger';

const app: Application = express();

// Request timing middleware (must be first)
app.use(requestTimer);

// Request logging middleware
app.use(requestLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/', healthRoutes);
app.use('/', taskRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
