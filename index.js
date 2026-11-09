require('dotenv').config();
const { createApp } = require('./src/app');
const PostgresTaskRepository = require('./src/repositories/postgresTaskRepository');
const TaskService = require('./src/services/taskService');

const port = Number(process.env.PORT) || 3000;
const repository = new PostgresTaskRepository(process.env.DATABASE_URL);
const app = createApp(new TaskService(repository));
const server = app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await repository.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
