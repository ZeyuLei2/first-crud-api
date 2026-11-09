const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../openapi.json');
const createTaskRouter = require('./routes/tasks');

function createApp(taskService) {
  const app = express();
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
  return app;
}

module.exports = { createApp };
