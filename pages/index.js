import { useCallback, useEffect, useMemo, useState } from 'react';

const initialForm = {
  id: null,
  title: '',
  description: '',
  dueDate: '',
  topic: '',
  status: 'Todo'
};

const sortOptions = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'topic', label: 'Topic' },
  { value: 'status', label: 'Status' }
];
const statusOptions = ['All', 'Todo', 'In-Progress', 'Complete'];

function isOverdue(task) {
  return task.status !== 'Complete' && new Date(task.dueDate) < new Date();
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ status: 'All', topic: 'All', sort: 'dueDate', archived: '0' });
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const topics = useMemo(() => {
    const found = tasks.map((task) => task.topic).filter(Boolean);
    return ['All', ...Array.from(new Set(found))];
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    const query = new URLSearchParams(filters);
    const response = await fetch(`/api/tasks?${query.toString()}`);
    const result = await response.json();
    setTasks(result.tasks || []);
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function resetForm() {
    setForm(initialForm);
    setIsEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = '/api/tasks';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(isEditing ? 'Task updated.' : 'Task created.');
      resetForm();
      await fetchTasks();
    } else {
      setMessage(result.error || 'Could not save task.');
    }
  }

  async function handleArchive(id) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchTasks();
  }

  function handleEdit(task) {
    setForm({ ...task });
    setIsEditing(true);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="eyebrow">Local-first task manager</p>
          <h1>Todo tasks</h1>
          <p>Create, edit, and archive tasks with due date notifications and persistent local storage.</p>
        </div>
      </header>

      <section className="panel">
        <h2>{isEditing ? 'Edit task' : 'New task'}</h2>
        <form onSubmit={handleSubmit} className="task-form">
          <label>
            Title
            <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
          </label>
          <div className="row">
            <label>
              Due Date
              <input type="date" value={form.dueDate} onChange={(e) => updateForm('dueDate', e.target.value)} required />
            </label>
            <label>
              Topic
              <input value={form.topic} onChange={(e) => updateForm('topic', e.target.value)} required />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                {statusOptions.slice(1).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="button-row">
            <button type="submit">{isEditing ? 'Save changes' : 'Add task'}</button>
            <button type="button" className="secondary" onClick={resetForm}>Reset</button>
          </div>
          {message ? <p className="message">{message}</p> : null}
        </form>
      </section>

      <section className="panel">
        <div className="filters">
          <div>
            <label>
              Status
              <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Topic
              <select value={filters.topic} onChange={(e) => setFilters((prev) => ({ ...prev, topic: e.target.value }))}>
                {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </label>
          </div>
          <div>
            <label>
              Sort by
              <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" checked={filters.archived === '1'} onChange={(e) => setFilters((prev) => ({ ...prev, archived: e.target.checked ? '1' : '0' }))} />
              Show archived
            </label>
          </div>
        </div>

        <div className="task-list">
          {tasks.length ? (
            tasks.map((task) => (
              <article key={task.id} className={`task-card ${task.archived ? 'archived' : ''}`}>
                <header className="task-head">
                  <div>
                    <h3>{task.title}</h3>
                    <p className="meta">{task.topic} · {task.status} · due {formatDate(task.dueDate)}</p>
                  </div>
                  <div className="actions">
                    {isOverdue(task) ? <span className="badge overdue">Overdue</span> : null}
                    {task.archived ? <span className="badge archived-badge">Archived</span> : null}
                  </div>
                </header>
                <p className="description">{task.description || 'No description provided.'}</p>
                <footer className="task-footer">
                  <button type="button" onClick={() => handleEdit(task)}>Edit</button>
                  {!task.archived ? <button type="button" className="secondary" onClick={() => handleArchive(task.id)}>Archive</button> : null}
                </footer>
              </article>
            ))
          ) : (
            <p className="empty-state">No tasks match the current filters.</p>
          )}
        </div>
      </section>
    </main>
  );
}
