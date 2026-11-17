// Part A: Employee Task Management using only the built-in http and fs modules.
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-memory task store (no database).
const tasks = [
  { id: 1, taskName: "Develop Login Page", assignedTo: "Rahul Sharma", status: "Pending" },
  { id: 2, taskName: "Design Database Schema", assignedTo: "Priya Singh", status: "In Progress" },
  { id: 3, taskName: "Write Unit Tests", assignedTo: "Amit Kumar", status: "Completed" },
];

const REQUIRED_FIELDS = ["id", "taskName", "assignedTo", "status"];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function handleAddTask(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // refuse oversized bodies
  });

  req.on("end", () => {
    let task;
    try {
      task = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { error: "Request body must be valid JSON" });
    }

    if (task === null || typeof task !== "object" || Array.isArray(task)) {
      return sendJson(res, 400, { error: "Request body must be a JSON object" });
    }

    const missing = REQUIRED_FIELDS.filter(
      (field) => task[field] === undefined || task[field] === null || task[field] === ""
    );
    if (missing.length > 0) {
      return sendJson(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    }

    if (tasks.some((existing) => existing.id === task.id)) {
      return sendJson(res, 409, { error: `A task with id ${task.id} already exists` });
    }

    const newTask = {
      id: task.id,
      taskName: task.taskName,
      assignedTo: task.assignedTo,
      status: task.status,
    };
    tasks.push(newTask);
    sendJson(res, 201, { message: "Task added successfully", task: newTask });
  });
}

function handleHome(res) {
  const filePath = path.join(__dirname, "public", "index.html");
  fs.readFile(filePath, (err, content) => {
    if (err) {
      const notFound = err.code === "ENOENT";
      return sendHtml(
        res,
        notFound ? 404 : 500,
        `<h1>${notFound ? "404 - Page file not found" : "500 - Could not read the page"}</h1>`
      );
    }
    sendHtml(res, 200, content);
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  if (pathname === "/" && method === "GET") {
    return sendHtml(
      res,
      200,
      "<h1>Welcome to the Employee Task Management Application</h1>" +
        '<p>Try <a href="/tasks">/tasks</a>, <a href="/about">/about</a> or <a href="/home">/home</a>.</p>'
    );
  }

  if (pathname === "/tasks" && method === "GET") {
    return sendJson(res, 200, tasks);
  }

  if (pathname === "/about" && method === "GET") {
    return sendHtml(
      res,
      200,
      "<h1>About</h1><p>Employee Task Management is a small Node.js application " +
        "for assigning tasks to employees and tracking their status. " +
        "This server uses the built-in http and fs modules.</p>"
    );
  }

  if (pathname === "/home" && method === "GET") {
    return handleHome(res);
  }

  if (pathname === "/add-task" && method === "POST") {
    return handleAddTask(req, res);
  }

  // Known route, wrong method.
  if (["/", "/tasks", "/about", "/home", "/add-task"].includes(pathname)) {
    return sendJson(res, 405, { error: `${method} is not allowed on ${pathname}` });
  }

  sendHtml(res, 404, "<h1>404 - Page not found</h1>");
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});
