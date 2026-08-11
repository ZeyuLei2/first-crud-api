const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

const tasks = [
    {
        id: 1,
        title: "Learn Node.js",
        done: true
    },
    {
        id: 2,
        title: "Build a REST API",
        done: false
    },
    {
        id: 3,
        title: "Test the API",
        done: false
    }
];

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
    res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {  
    const  taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).json({ message: `Task ${taskId} not found` });
    }

    res.json(task);

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