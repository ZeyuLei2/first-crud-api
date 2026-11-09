const { Pool } = require('pg');

class PostgresTaskRepository {
  constructor(connectionString) {
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({ connectionString });
  }
  async findAll() {
    const { rows } = await this.pool.query('SELECT id, title, done FROM tasks ORDER BY id');
    return rows;
  }
  async findById(id) {
    const { rows } = await this.pool.query('SELECT id, title, done FROM tasks WHERE id = $1', [id]);
    return rows[0] || null;
  }
  async create({ title, done }) {
    const { rows } = await this.pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING id, title, done', [title, done]
    );
    return rows[0];
  }
  async update(id, changes) {
    const { rows } = await this.pool.query(
      `UPDATE tasks SET title = COALESCE($2, title), done = COALESCE($3, done)
       WHERE id = $1 RETURNING id, title, done`,
      [id, changes.title ?? null, changes.done ?? null]
    );
    return rows[0] || null;
  }
  async delete(id) {
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  async ping() { await this.pool.query('SELECT 1'); }
  close() { return this.pool.end(); }
}

module.exports = PostgresTaskRepository;
