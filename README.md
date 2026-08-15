First CRUD API

A simple RESTful CRUD API built with Node.js and Express.js.
This project demonstrates the basic Create, Read, Update, and Delete (CRUD) operations for managing tasks. It also includes Swagger UI documentation generated from an OpenAPI 3.0 specification.

Features

* Create a new task
* Get all tasks
* Get a task by ID
* Update a task
* Delete a task
* Interactive API documentation with Swagger UI

Tech Stack

* Node.js
* Express.js
* Swagger UI Express
* OpenAPI 3.0

Installation

Clone the repository:

git clone https://github.com/ZeyuLei2/first-crud-api.git
cd first-crud-api

Install dependencies and start the server:

npm install && node index.js

The server will start on:

http://localhost:3000

Swagger UI is available at:

http://localhost:3000/docs

⸻

API Endpoints

Method	Endpoint	Description
GET	/tasks	Get all tasks
GET	/tasks/:id	Get a task by ID
POST	/tasks	Create a new task
PUT	/tasks/:id	Update a task
DELETE	/tasks/:id	Delete a task

⸻

Example Request

Create a new task:

curl -i -X POST http://localhost:3000/tasks \
-H "Content-Type: application/json" \
-d '{"title":"Buy milk"}'

Example response:

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
{
  "id": 4,
  "title": "Buy milk",
  "done": false
}

⸻

Project Structure

First CRUD API/
├── index.js
├── openapi.json
├── package.json
├── package-lock.json
├── README.md
└── node_modules/

⸻

Swagger UI

Open the following URL after starting the server:

http://localhost:3000/docs

⸻

Example Task Object

{
  "id": 1,
  "title": "Learn Node.js",
  "done": false
}

⸻

HTTP Status Codes

Status Code	Meaning
200	Request successful
201	Resource created successfully
204	Resource deleted successfully (no response body)
400	Invalid request
404	Task not found

⸻

Author

Created as a learning project for building a RESTful CRUD API with Express.js and documenting it using OpenAPI 3.0 and Swagger UI.