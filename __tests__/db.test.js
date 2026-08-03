const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, 'test-tasks.db');

function cleanDb() {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

beforeEach(() => {
  cleanDb();
  process.env.TASKS_DB_PATH = testDbPath;
  delete require.cache[require.resolve('../lib/db')];
});

afterEach(() => {
  const { closeDatabase } = require('../lib/db');
  closeDatabase();
  cleanDb();
});

test('creates and returns a task with required fields', () => {
  const { createTask, getAllTasks } = require('../lib/db');
  const task = createTask({
    title: 'Write report',
    description: 'Review the quarterly notes',
    dueDate: '2099-12-31',
    topic: 'Work',
    status: 'Todo'
  });

  expect(task).toMatchObject({
    title: 'Write report',
    topic: 'Work',
    status: 'Todo',
    archived: false
  });

  const tasks = getAllTasks({ archived: 0 });
  expect(tasks).toHaveLength(1);
  expect(tasks[0].title).toBe('Write report');
});

test('updates an existing task and applies status filtering', () => {
  const { createTask, updateTask, getAllTasks } = require('../lib/db');
  const task = createTask({
    title: 'Fix issue',
    description: 'Resolve bug in module',
    dueDate: '2099-01-01',
    topic: 'Engineering',
    status: 'Todo'
  });

  const updated = updateTask({
    id: task.id,
    title: 'Fix issue',
    description: 'Resolve bug in module quickly',
    dueDate: '2099-01-01',
    topic: 'Engineering',
    status: 'In-Progress'
  });

  expect(updated.status).toBe('In-Progress');
  const filtered = getAllTasks({ status: 'In-Progress', archived: 0 });
  expect(filtered).toHaveLength(1);
});

test('archives a task and returns it when archived filter is enabled', () => {
  const { createTask, archiveTask, getAllTasks } = require('../lib/db');
  const task = createTask({
    title: 'Archive me',
    description: 'Keep this task for history',
    dueDate: '2099-06-01',
    topic: 'Archive',
    status: 'Complete'
  });

  const archived = archiveTask(task.id);
  expect(archived.archived).toBe(true);

  const activeTasks = getAllTasks({ archived: 0 });
  expect(activeTasks).toHaveLength(0);

  const archivedTasks = getAllTasks({ archived: 1 });
  expect(archivedTasks).toHaveLength(1);
  expect(archivedTasks[0].title).toBe('Archive me');
});
