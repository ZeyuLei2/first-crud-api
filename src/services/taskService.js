class TaskService {
  constructor(repository) { this.repository = repository; }
  list() { return this.repository.findAll(); }
  get(id) { return this.repository.findById(id); }
  create(title) { return this.repository.create({ title, done: false }); }
  update(id, changes) { return this.repository.update(id, changes); }
  remove(id) { return this.repository.delete(id); }
  healthCheck() { return this.repository.ping(); }
}

module.exports = TaskService;
