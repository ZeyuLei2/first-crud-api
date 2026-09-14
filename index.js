const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tasks.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false
    )`);

    db.get("SELECT COUNT(*) AS count FROM tasks", (err, row) => {
        if (err) {
            console.error("Error counting tasks:", err);
            return;
        }

        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
            stmt.run("Learn Node.js", true);
            stmt.run("Build a REST API", false);
            stmt.run("Test the API", false);
            stmt.finalize();
            console.log("Inserted initial tasks into the database.");
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'First Crud API',
        version: '1.0',
        endpoint: ["tasks"]
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
    });
});

app.get('/tasks', (req, res) => {
    db.all("SELECT * FROM tasks", (err, rows) => {
        if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).json({ message: "Error fetching tasks" });
        }
        res.json(rows);
    });
});

app.get('/tasks/:id', (req, res) => {  
    const taskId = parseInt(req.params.id);
    db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, row) => {
        if (err) {
            console.error("Error fetching task:", err);
            return res.status(500).json({ message: "Error fetching task" });
        }
        if (!row) {
            return res.status(404).json({ message: `Task ${taskId} not found` });
        }
        res.json(row);
    });
});

app.post('/tasks', (req, res) => {
    const { title } = req.body;
    
    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
    }

    const newID = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const newTask = {
        id: newID,
        title: title.trim(),
        done: false
    };
    
    tasks.push(newTask);

    res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).json({ message: `Task ${taskId} not found` });
    }
    
    const { title, done } = req.body;

    if (title === undefined && done === undefined) {
        return res.status(400).json({ message: "At least one field (title or done) is required" });
    }

    if (title !== undefined && title.trim() === "") {
        return res.status(400).json({ message: "Title cannot be empty" });
    }
    if (title !== undefined) {
        task.title = title.trim();
    }
    if (done !== undefined && typeof done !== 'boolean') {
        return res.status(400).json({ message: "Done must be a boolean value" });
    }
    if (done !== undefined) {
        task.done = done;
    }

    res.status(200).json(task);
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ message: `Task ${taskId} not found` });
    }

    tasks.splice(taskIndex, 1);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});