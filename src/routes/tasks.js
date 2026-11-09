const express = require('express');

function parseId(value) {
  return /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
}

function createTaskRouter(taskService) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try { res.json(await taskService.list()); }
    catch (error) { handleError(res, error, 'fetching tasks'); }
  });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Task id must be a positive integer' });
    try {
      const task = await taskService.get(id);
      if (!task) return res.status(404).json({ message: `Task ${id} not found` });
      res.json(task);
    } catch (error) { handleError(res, error, 'fetching task'); }
  });

  router.post('/', async (req, res) => {
    const { title } = req.body;
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    try { res.status(201).json(await taskService.create(title.trim())); }
    catch (error) { handleError(res, error, 'creating task'); }
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Task id must be a positive integer' });
    const { title, done } = req.body;
    if (title === undefined && done === undefined) {
      return res.status(400).json({ message: 'At least one field (title or done) is required' });
    }
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ message: 'Done must be a boolean value' });
    }
    try {
      const task = await taskService.update(id, {
        ...(title !== undefined && { title: title.trim() }),
        ...(done !== undefined && { done }),
      });
      if (!task) return res.status(404).json({ message: `Task ${id} not found` });
      res.json(task);
    } catch (error) { handleError(res, error, 'updating task'); }
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Task id must be a positive integer' });
    try {
      if (!(await taskService.remove(id))) {
        return res.status(404).json({ message: `Task ${id} not found` });
      }
      res.json({ message: `Task ${id} deleted successfully` });
    } catch (error) { handleError(res, error, 'deleting task'); }
  });
  return router;
}

function handleError(res, error, action) {
  console.error(`Error ${action}:`, error);
  res.status(500).json({ message: `Error ${action}` });
}

module.exports = createTaskRouter;
