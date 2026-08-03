# Local Todo App (Next.js + SQLite)

A local-first todo application built with Next.js and SQLite. Tasks are persisted in a local SQLite database and can be created, edited, archived, filtered, and sorted without any user accounts.

## Features

- Create, edit, and archive tasks
- Each task has: Title, Description, Due Date, Topic, Status
- Tasks are never deleted; archived tasks remain viewable
- Sort tasks by due date, topic, or status
- Filter tasks by status, topic, and archived state
- Overdue tasks are highlighted automatically
- All data persists across restarts using SQLite

## Third-Party Code

- `next` — React framework used for local web UI and API routing.
- `react` / `react-dom` — UI rendering library.
- `better-sqlite3` — native SQLite driver for local persistence with synchronous access.
- `jest` — test runner for behavior verification.
- `babel-jest`, `@babel/preset-env`, `@babel/preset-react` — enable Jest to run React/JSX code.
- `@testing-library/react` / `@testing-library/jest-dom` — component and DOM testing utilities.
- `identity-obj-proxy` — Jest CSS module mock to ignore CSS imports.

## Database Design

The application uses a single table:

- `tasks`
  - `id`: integer primary key
  - `title`: text, required
  - `description`: text, optional
  - `dueDate`: text, required (ISO date string)
  - `topic`: text, required
  - `status`: text, required (`Todo`, `In-Progress`, `Complete`)
  - `archived`: integer, required (`0` for active, `1` for archived)
  - `createdAt`: text, required
  - `updatedAt`: text, required

There are no additional tables or relationships; all task details are stored in the single `tasks` table.

## Running It

### Requirements

- Node.js 18 or later
- npm

### Commands

From the project root:

```bash
cd todo-app
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Tests

Run the full test suite with:

```bash
npm test
```

All tests execute using Jest and validate task creation, updating, archiving, and API behavior.
