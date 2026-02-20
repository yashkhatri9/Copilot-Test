import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'A RESTful API for task management with in-memory storage',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique task identifier',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Task priority',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp',
            },
          },
        },
        CreateTaskDto: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Task title (required)',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description (required)',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              default: 'TODO',
              description: 'Task status (optional, defaults to TODO)',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              default: 'MEDIUM',
              description: 'Task priority (optional, defaults to MEDIUM)',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date (optional)',
            },
          },
        },
        UpdateTaskDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Task priority',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                statusCode: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
