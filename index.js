const express = require('express');
const app = express();
const port = 3000;

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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});