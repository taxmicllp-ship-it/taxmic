# Phase 4 — Tasks Module Requirements

## Overview

Implement task management for Taxmic. Tasks allow firm users to create, assign, and track work items linked to clients.

## Schema Reality (Source of Truth)

The actual database schema differs from the original prompt. These are the facts:

- `task_statuses` table does NOT exist — status is an enum column on `tasks`
- `assignee_id` column does NOT exist on `tasks` — assignment is via `task_assignments` join table
- `status_id` column does NOT exist — status is `task_status_enum` directly

### tasks table
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| firm_id | UUID | FK → firms, required |
| client_id | UUID? | FK → clients, optional |
| title | VARCHAR(255) | required |
| description | TEXT | optional |
| status | task_status_enum | default: new |
| priority | task_priority_enum | default: medium |
| due_date | DATE | optional |
| completed_at | TIMESTAMP | optional |
| created_by | UUID? | FK → users |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |
| deleted_at | TIMESTAMP? | soft delete |

### task_assignments table
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| task_id | UUID | FK → tasks |
| user_id | UUID | FK → users |
| assigned_by | UUID? | FK → users |
| assigned_at | TIMESTAMP | auto |

Unique constraint: `(task_id, user_id)` — one user assigned once per task.

### Enums
- `task_status_enum`: `new`, `in_progress`, `waiting_client`, `review`, `completed`
- `task_priority_enum`: `low`, `medium`, `high`, `urgent`

---

## Functional Requirements

### REQ-1: Task Creation
- User can create a task with title (required), description, status, priority, due_date, client_id
- `firm_id` is set from JWT — never from request body
- `created_by` is set from JWT user ID
- Default status: `new`
- Default priority: `medium`

### REQ-2: Task Assignment
- A task can be assigned to one or more firm users via `task_assignments`
- Assignment is done at create time or via PATCH
- API accepts `assignee_ids: string[]` — convenience field
- Backend writes to `task_assignments` table
- Response includes `assignees` array (user IDs)

### REQ-3: Task Status Update
- PATCH /tasks/:id can update: title, description, status, priority, due_date, assignee_ids
- When status is set to `completed`, `completed_at` is set to now()
- When status is changed away from `completed`, `completed_at` is cleared

### REQ-4: Task List and Filter
- GET /tasks supports optional query params: `client_id`, `assignee_id`, `status`, `due_date`
- Results ordered by `due_date ASC NULLS LAST`, then `created_at DESC`
- Pagination: `page`, `limit` (default 20, max 100)
- All results scoped to `firm_id` from JWT

### REQ-5: Task Delete
- DELETE /tasks/:id performs soft delete (sets `deleted_at`)
- Deleted tasks excluded from all list queries
- Returns 204 No Content

### REQ-6: Client Tasks
- GET /clients/:id/tasks returns all non-deleted tasks for a specific client
- Scoped to `firm_id` — cross-tenant access impossible

---

## Non-Functional Requirements

### NFR-1: Tenant Isolation
Every query must include `firm_id` in the WHERE clause. No exceptions.

### NFR-2: No Cross-Module Repository Access
`TasksService` may call `ClientsService` to verify client existence. It must NOT import `ClientsRepository` directly.

### NFR-3: Shared Middleware
Must reuse `authenticate`, `tenant-context`, `validation` from `shared/middleware/`.

### NFR-4: No Schema Changes
Do not modify Prisma schema, add migrations, or alter enums.

---

## Out of Scope (Phase 4)

- Task comments (table exists, not implemented)
- Subtasks
- Task reminders / email notifications
- Task templates
- Recurring tasks
- Kanban board
- Time tracking
- `task-statuses` service/repository (no such table)
