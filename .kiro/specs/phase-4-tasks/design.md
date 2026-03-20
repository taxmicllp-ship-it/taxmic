# Phase 4 — Tasks Module Design

## Backend Architecture

### Folder Structure

```
apps/api/src/modules/tasks/
├── tasks.controller.ts
├── tasks.service.ts
├── tasks.repository.ts
├── tasks.routes.ts
├── tasks.types.ts
├── tasks.validation.ts
└── __tests__/
    ├── tasks.service.test.ts
    └── tasks.controller.test.ts
```

No `task-statuses.service.ts` or `task-statuses.repository.ts` — there is no `task_statuses` table.

---

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/v1/tasks | List tasks with optional filters |
| POST | /api/v1/tasks | Create a task |
| GET | /api/v1/tasks/:id | Get task by ID |
| PATCH | /api/v1/tasks/:id | Update task |
| DELETE | /api/v1/tasks/:id | Soft delete task |
| GET | /api/v1/clients/:id/tasks | List tasks for a client |

All routes require `authenticate` + `tenantContext` middleware.

---

### Request / Response Shapes

#### POST /tasks — Create Task
```json
// Request body
{
  "title": "Prepare tax return",
  "description": "Q1 2026 filing",
  "status": "new",
  "priority": "high",
  "due_date": "2026-04-15",
  "client_id": "uuid",
  "assignee_ids": ["user-uuid-1"]
}

// Response 201
{
  "id": "uuid",
  "firm_id": "uuid",
  "client_id": "uuid",
  "title": "Prepare tax return",
  "description": "Q1 2026 filing",
  "status": "new",
  "priority": "high",
  "due_date": "2026-04-15",
  "completed_at": null,
  "created_by": "uuid",
  "assignees": [{ "user_id": "uuid", "assigned_at": "..." }],
  "created_at": "...",
  "updated_at": "..."
}
```

#### GET /tasks — List Tasks
```
Query params (all optional):
  client_id=uuid
  assignee_id=uuid
  status=new|in_progress|waiting_client|review|completed
  due_date=2026-04-15
  page=1
  limit=20
```

#### PATCH /tasks/:id — Update Task
```json
// All fields optional
{
  "title": "...",
  "description": "...",
  "status": "in_progress",
  "priority": "medium",
  "due_date": "2026-04-20",
  "assignee_ids": ["uuid-1", "uuid-2"]
}
```

When `assignee_ids` is provided on PATCH, the existing assignments are replaced (delete all, insert new).

---

### Layer Responsibilities

**tasks.routes.ts**
- Mount all 6 routes
- Apply `authenticate`, `tenantContext`
- Apply `validate(schema)` middleware per route

**tasks.controller.ts**
- Extract `req.user.firmId`, `req.params`, `req.query`, `req.body`
- Call `tasksService` methods
- Return appropriate HTTP status codes
- No business logic

**tasks.service.ts**
- Business logic: validate client exists (via `clientsService`), handle `completed_at` logic
- Orchestrate repository calls
- No Prisma imports

**tasks.repository.ts**
- All Prisma queries
- Imports from `@repo/database`
- Handles `task_assignments` upsert/replace
- Returns raw Prisma objects

**tasks.validation.ts**
- Zod schemas for create, update, list query
- Status and priority validated against enum values

**tasks.types.ts**
- DTOs: `CreateTaskDto`, `UpdateTaskDto`, `ListTasksQuery`, `TaskResponse`

---

### Assignment Design

Since `task_assignments` is a join table, the service handles it as follows:

**On create:** if `assignee_ids` provided, insert rows into `task_assignments` after task creation.

**On update:** if `assignee_ids` provided, delete all existing assignments for the task, then insert new ones. This is a full replace — not a merge.

**On read:** join `task_assignments` and return as `assignees: [{ user_id, assigned_at }]`.

**On filter by assignee_id:** query tasks that have a matching row in `task_assignments`.

---

### completed_at Logic

```typescript
// In service, on PATCH:
if (data.status === 'completed' && existingTask.status !== 'completed') {
  completedAt = new Date();
} else if (data.status && data.status !== 'completed') {
  completedAt = null;
}
```

---

## Frontend Architecture

### Folder Structure

```
apps/web/src/features/tasks/
├── api/
│   └── tasks-api.ts
├── components/
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   ├── TaskCard.tsx
│   └── TaskStatusBadge.tsx
├── hooks/
│   ├── useTasks.ts
│   ├── useCreateTask.ts
│   └── useUpdateTask.ts
└── types.ts

apps/web/src/pages/tasks/
├── index.tsx       → /tasks
├── new.tsx         → /tasks/new
└── [id].tsx        → /tasks/:id
```

---

### Frontend Component Responsibilities

**TaskList.tsx** — renders a table of tasks using existing `Table` components. Supports filter controls for status and client.

**TaskForm.tsx** — create/edit form. Fields: title, description, status (select), priority (select), due_date (date input), client_id (optional), assignee_ids (optional).

**TaskCard.tsx** — compact task display for use in client detail pages or dashboard widgets.

**TaskStatusBadge.tsx** — colored badge for status values:
- `new` → gray
- `in_progress` → blue
- `waiting_client` → yellow
- `review` → purple
- `completed` → green

---

### Hooks

**useTasks(params?)** — `useQuery` wrapping `tasksApi.list(params)`

**useCreateTask()** — `useMutation` wrapping `tasksApi.create()`, invalidates `['tasks']`

**useUpdateTask()** — `useMutation` wrapping `tasksApi.update()`, invalidates `['tasks']` and `['tasks', id]`

---

### Route Registration (App.tsx additions)

```tsx
import TasksPage from './pages/tasks/index';
import NewTaskPage from './pages/tasks/new';
import TaskDetailPage from './pages/tasks/[id]';

// Inside DashboardLayout route group:
<Route path="/tasks" element={<TasksPage />} />
<Route path="/tasks/new" element={<NewTaskPage />} />
<Route path="/tasks/:id" element={<TaskDetailPage />} />
```

---

## Data Flow

```
User action
  → React page
  → hook (useMutation / useQuery)
  → tasks-api.ts (axios via api.ts)
  → GET/POST/PATCH/DELETE /api/v1/tasks
  → tasks.routes.ts
  → authenticate + tenantContext middleware
  → tasks.controller.ts
  → tasks.service.ts
  → tasks.repository.ts (+ task_assignments)
  → Prisma → PostgreSQL
```

---

## Tenant Isolation Guarantee

Every repository method receives `firmId` as first argument and includes it in every `where` clause. The controller always passes `req.user!.firmId` — never a value from the request body or params.
