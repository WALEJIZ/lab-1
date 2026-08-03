const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, 'test-api-tasks.db');

function cleanDb() {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

beforeEach(() => {
  cleanDb();
  process.env.TASKS_DB_PATH = testDbPath;
  delete require.cache[require.resolve('../lib/db')];
  delete require.cache[require.resolve('../pages/api/tasks')];
});

afterEach(() => {
  const { closeDatabase } = require('../lib/db');
  closeDatabase();
  cleanDb();
});

function createMockResponse() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (payload) {
    this.body = payload;
    return this;
  };
  return res;
}

test('creates a task through the API and reads it back', async () => {
  const handler = require('../pages/api/tasks');
  const reqCreate = {
    method: 'POST',
    body: {
      title: 'API Task',
      description: 'Sent through API',
      dueDate: '2099-05-05',
      topic: 'API',
      status: 'Todo'
    }
  };
  const resCreate = createMockResponse();
  await handler(reqCreate, resCreate);

  expect(resCreate.statusCode).toBe(201);
  expect(resCreate.body.task.title).toBe('API Task');

  const reqList = { method: 'GET', query: { archived: '0' } };
  const resList = createMockResponse();
  await handler(reqList, resList);

  expect(resList.statusCode).toBe(200);
  expect(resList.body.tasks).toHaveLength(1);
  expect(resList.body.tasks[0].topic).toBe('API');
});

test('archives a task via the API route', async () => {
  const handler = require('../pages/api/tasks');
  const reqCreate = {
    method: 'POST',
    body: {
      title: 'Archive API Task',
      description: 'Testing archive path',
      dueDate: '2099-07-07',
      topic: 'Archive',
      status: 'Complete'
    }
  };
  const resCreate = createMockResponse();
  await handler(reqCreate, resCreate);
  const taskId = resCreate.body.task.id;

  const resPatch = createMockResponse();
  await handler({ method: 'PATCH', body: { id: taskId } }, resPatch);
  expect(resPatch.statusCode).toBe(200);
  expect(resPatch.body.task.archived).toBe(true);

  const resGet = createMockResponse();
  await handler({ method: 'GET', query: { archived: '1' } }, resGet);
  expect(resGet.body.tasks).toHaveLength(1);
  expect(resGet.body.tasks[0].id).toBe(taskId);
});
