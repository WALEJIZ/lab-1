import { getAllTasks, createTask, updateTask, archiveTask, TaskStatus } from '../../lib/db';

function parseQueryValue(value) {
  if (value === '1' || value === '0') return Number(value);
  return value;
}

function validateTask(body) {
  const { title, dueDate, topic, status } = body;
  if (!title || !dueDate || !topic || !status) {
    return 'Title, due date, topic, and status are required';
  }
  if (!TaskStatus.includes(status)) {
    return `Status must be one of ${TaskStatus.join(', ')}`;
  }
  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { status, topic, archived, sort } = req.query;
      const tasks = getAllTasks({
        status: status || undefined,
        topic: topic || undefined,
        archived: archived !== undefined ? parseQueryValue(archived) : 0,
        sort
      });
      return res.status(200).json({ tasks });
    }

    if (req.method === 'POST') {
      const validation = validateTask(req.body);
      if (validation) return res.status(400).json({ error: validation });
      const task = createTask(req.body);
      return res.status(201).json({ task });
    }

    if (req.method === 'PUT') {
      const validation = validateTask(req.body);
      if (validation) return res.status(400).json({ error: validation });
      if (!req.body.id) return res.status(400).json({ error: 'Task id is required for update' });
      const task = updateTask(req.body);
      return res.status(200).json({ task });
    }

    if (req.method === 'PATCH') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Task id is required to archive' });
      const task = archiveTask(id);
      return res.status(200).json({ task });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
