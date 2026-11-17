const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../openapi.json');
const createTaskRouter = require('./routes/tasks');
const createAuthRouter = require('./routes/auth');
const publicRouter = require('./routes/public');
const createProtectedRouter = require('./routes/protected');
const createRequireAuth = require('./middleware/requireAuth');

function createApp(taskService, createAuthClient) {
  const app = express();
  const requireAuth = createRequireAuth(createAuthClient);
  app.use(express.json());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/', (req, res) => res.json({ name: 'First Crud API', version: '1.0', endpoint: ['tasks'] }));
  app.get('/health', async (req, res) => {
    try {
      await taskService.healthCheck();
      res.json({ status: 'OK' });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ status: 'ERROR' });
    }
  });
  app.use('/tasks', createTaskRouter(taskService));
  app.use('/auth', createAuthRouter(createAuthClient, requireAuth));
  app.use('/public', publicRouter);
  app.use('/protected', createProtectedRouter(requireAuth));
  return app;
}

module.exports = { createApp };
