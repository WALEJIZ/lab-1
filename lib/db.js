const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.TASKS_DB_PATH || path.join(process.cwd(), 'data', 'tasks.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);`);

const TaskStatus = ['Todo', 'In-Progress', 'Complete'];

function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    dueDate: row.dueDate,
    topic: row.topic,
    status: row.status,
    archived: Boolean(row.archived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function getAllTasks({ status, topic, archived = 0, sort = 'dueDate' } = {}) {
  const filters = [];
  const params = {};

  if (status && status !== 'All') {
    filters.push('status = @status');
    params.status = status;
  }
  if (topic && topic !== 'All') {
    filters.push('topic = @topic');
    params.topic = topic;
  }
  if (archived !== undefined) {
    filters.push('archived = @archived');
    params.archived = Number(archived);
  }

  const validSort = ['topic', 'status', 'dueDate'];
  const orderBy = validSort.includes(sort) ? sort : 'dueDate';
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const rows = db.prepare(`SELECT * FROM tasks ${where} ORDER BY ${orderBy} ASC, id ASC`).all(params);
  return rows.map(serializeTask);
}

function createTask({ title, description, dueDate, topic, status }) {
  if (!title || !dueDate || !topic || !status) {
    throw new Error('Missing required task fields');
  }
  if (!TaskStatus.includes(status)) {
    throw new Error('Invalid status');
  }

  const now = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO tasks (title, description, dueDate, topic, status, archived, createdAt, updatedAt)
    VALUES (@title, @description, @dueDate, @topic, @status, 0, @createdAt, @updatedAt)`);
  const info = stmt.run({ title, description: description || '', dueDate, topic, status, createdAt: now, updatedAt: now });
  return getAllTasks({ archived: 0, sort: 'dueDate' }).find((task) => task.id === info.lastInsertRowid);
}

function updateTask({ id, title, description, dueDate, topic, status, archived = 0 }) {
  if (!id || !title || !dueDate || !topic || !status) {
    throw new Error('Missing required task fields');
  }
  if (!TaskStatus.includes(status)) {
    throw new Error('Invalid status');
  }
  const now = new Date().toISOString();
  db.prepare(`UPDATE tasks SET title = @title, description = @description, dueDate = @dueDate,
    topic = @topic, status = @status, archived = @archived, updatedAt = @updatedAt
    WHERE id = @id`).run({ id, title, description: description || '', dueDate, topic, status, archived: Number(archived), updatedAt: now });
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) ? serializeTask(db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)) : null;
}

function archiveTask(id) {
  if (!id) {
    throw new Error('Task id is required to archive');
  }
  const now = new Date().toISOString();
  db.prepare(`UPDATE tasks SET archived = 1, updatedAt = @updatedAt WHERE id = @id`).run({ id, updatedAt: now });
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) ? serializeTask(db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)) : null;
}

function closeDatabase() {
  if (!db.closed) {
    db.close();
  }
}

module.exports = {
  TaskStatus,
  getAllTasks,
  createTask,
  updateTask,
  archiveTask,
  closeDatabase,
  dbPath
};
