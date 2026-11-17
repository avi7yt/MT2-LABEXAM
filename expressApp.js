// Part B: Employee Task Management REST API using Express.js.
import express from "express";

const app = express();
const PORT = 4000;

app.use(express.json());

// Allow the frontend (served from port 3000) to call this API.
app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// In-memory task store (no database).
let tasks = [
  { id: 1, taskName: "Develop Login Page", assignedTo: "Rahul Sharma", status: "Pending", priority: "High" },
  { id: 2, taskName: "Design Database Schema", assignedTo: "Priya Singh", status: "In Progress", priority: "Medium" },
  { id: 3, taskName: "Write Unit Tests", assignedTo: "Amit Kumar", status: "Completed", priority: "Low" },
];

const REQUIRED_FIELDS = ["taskName", "assignedTo", "status", "priority"];

function findMissing(body) {
  return REQUIRED_FIELDS.filter(
    (field) => body?.[field] === undefined || body[field] === null || body[field] === ""
  );
}

// GET /tasks - all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id - one task
app.get("/tasks/:id", (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// POST /tasks - add a task
app.post("/tasks", (req, res) => {
  const missing = findMissing(req.body);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  const nextId = tasks.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const id = req.body.id === undefined ? nextId : Number(req.body.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive whole number" });
  }
  if (tasks.some((item) => item.id === id)) {
    return res.status(409).json({ error: `A task with id ${id} already exists` });
  }

  const { taskName, assignedTo, status, priority } = req.body;
  const task = { id, taskName, assignedTo, status, priority };
  tasks.push(task);
  res.status(201).json({ message: "Task added successfully", task });
});

// PUT /tasks/:id - update a task
app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });

  const missing = findMissing(req.body);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  const { taskName, assignedTo, status, priority } = req.body;
  Object.assign(task, { taskName, assignedTo, status, priority });
  res.json({ message: "Task updated successfully", task });
});

// DELETE /tasks/:id - delete a task
app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  const [removed] = tasks.splice(index, 1);
  res.json({ message: "Task deleted successfully", task: removed });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Malformed JSON and other errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must be valid JSON" });
  }
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});
