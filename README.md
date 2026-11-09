# First CRUD API — PostgreSQL + Docker

An Express CRUD API backed by PostgreSQL. Docker Compose starts the application and database together, and a named Docker volume keeps task data across restarts.

## Start the stack

Requirements: Docker Desktop (or Docker Engine with Compose).

```bash
cp .env.example .env
docker compose up --build
```

The API is at <http://localhost:3000>, Swagger UI is at <http://localhost:3000/docs>, and `GET /health` checks the database connection. Stop it with `Ctrl+C` or `docker compose down`. Do **not** use `docker compose down -v` unless you intend to delete the database volume.

The `.env` file is gitignored. Change its example password for anything beyond local development. `DATABASE_URL` uses `db` as its hostname because that is the Compose service name.

## Database initialization

[`db/init.sql`](db/init.sql) creates the `tasks` table the first time PostgreSQL initializes an empty volume. PostgreSQL's Docker entrypoint does not rerun init scripts on an existing volume; apply later schema changes as migrations.

## API routes

- `GET /tasks` — list tasks
- `GET /tasks/:id` — get one task
- `POST /tasks` with `{ "title": "Ship A3" }` — create a task
- `PUT /tasks/:id` with `title` and/or `done` — update a task
- `DELETE /tasks/:id` — delete a task

## Repository swap and architecture note

Routes delegate to `TaskService`, which depends only on the repository methods `findAll`, `findById`, `create`, `update`, and `delete`. `index.js` is the composition root that selects `PostgresTaskRepository`; the service contains no SQL and the route URLs and response shapes remain the same.

Honest A2 note: the starting repository supplied for this assignment was a single-file SQLite app, not a layered in-memory implementation. Therefore this submission had to introduce the missing route/service/repository layers while preserving the existing HTTP behavior. Future storage swaps require changing the repository wired in `index.js`, not the service or routes.

## Persistence check

The following check was performed locally against the running Docker Compose stack.

1. Confirmed the application could connect to PostgreSQL:

```bash
curl http://localhost:3000/health
```

Response:

```json
{"status":"OK"}
```

2. Created a task before removing the containers:

```bash
curl -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Persistence test"}'
```

Response:

```json
{"id":1,"title":"Persistence test","done":false}
```

3. Removed and recreated both application and database containers:

```bash
docker compose down
docker compose up -d
```

Compose reported that both containers were removed, then the database became healthy and the application started. No `-v` flag was used, so the named volume was preserved.

4. Queried the tasks after both containers were recreated:

```bash
curl http://localhost:3000/tasks
```

Response:

```json
[{"id":1,"title":"Persistence test","done":false}]
```

Result: the same task, including its ID, title, and completion status, remained after both containers were removed and recreated. This verifies persistence through the `postgres_data` named volume declared in `docker-compose.yml`.

## Run the app outside Docker (optional)

Run all services through Compose as recommended. For local Node development, point `DATABASE_URL` at a reachable PostgreSQL instance, run `npm install`, then `npm start`.
