const express = require('express');
const app = express();
const port = 3000;

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
    
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});