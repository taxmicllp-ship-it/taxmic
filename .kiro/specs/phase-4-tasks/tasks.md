# Phase 4 — Tasks Module Implementation Tasks

## Backend Tasks

- [x] 1. Create `apps/api/src/modules/tasks/tasks.types.ts`
  - Define `CreateTaskDto`, `UpdateTaskDto`, `ListTasksQuery`, `TaskAssignee`, `TaskResponse`
  - Status type: `'new' | 'in_progress' | 'waiting_client' | 'review' | 'completed'`
  - Priority type: `'low' | 'medium' | 'high' | 'urgent'`
  - `assignee_ids?: string[]` on create/update DTOs
  - References: REQ-1, REQ-2

- [x] 2. Create `apps/api/src/modules/tasks/tasks.validation.ts`
  - `CreateTaskSchema` — title required, all others optional with correct enum values
  - `UpdateTaskSchema` — all fields optional (partial of create)
  - `ListTasksQuerySchema` — optional `client_id`, `assignee_id`, `status`, `due_date`, `page`, `limit`
  - Use `z.enum` for status and priority matching actual enum values
  - References: REQ-1, REQ-3, REQ-4

- [x] 3. Create `apps/api/src/modules/tasks/tasks.repository.ts`
  - Import from `@repo/database` only
  - `create(firmId, data)` — inserts task, then inserts `task_assignments` rows if `assignee_ids` provided
  - `findById(firmId, taskId)` — includes `task_assignments` relation, filters `deleted_at: null`
  - `findAll(firmId, filters)` — supports `client_id`, `assignee_id` (via task_assignments join), `status`, `due_date` filters; ordered by `due_date ASC NULLS LAST`, `created_at DESC`; paginated
  - `findByClient(firmId, clientId)` — all non-deleted tasks for a client
  - `update(firmId, taskId, data)` — updates task fields; if `assignee_ids` provided, deletes all existing assignments then inserts new ones in a transaction
  - `softDelete(firmId, taskId)` — sets `deleted_at: new Date()`
  - All methods include `firm_id` in every `where` clause
  - References: REQ-1 through REQ-6, NFR-1

- [x] 4. Create `apps/api/src/modules/tasks/tasks.service.ts`
  - Import `tasksRepository` only — no cross-module repository imports
  - `createTask(firmId, userId, data)` — sets `created_by`, calls repository
  - `getTask(firmId, taskId)` — throws 404 if not found
  - `listTasks(firmId, query)` — delegates to repository with filters
  - `updateTask(firmId, taskId, data)` — handles `completed_at` logic: set to `now()` when status → `completed`, clear when status changes away from `completed`
  - `deleteTask(firmId, taskId)` — verifies task exists, then soft deletes
  - `listClientTasks(firmId, clientId)` — delegates to repository
  - References: REQ-1 through REQ-6, NFR-2

- [x] 5. Create `apps/api/src/modules/tasks/tasks.controller.ts`
  - `listTasks` — GET /tasks, passes `req.user!.firmId` + parsed query to service
  - `createTask` — POST /tasks, passes `req.user!.firmId`, `req.user!.userId`, body to service
  - `getTask` — GET /tasks/:id
  - `updateTask` — PATCH /tasks/:id
  - `deleteTask` — DELETE /tasks/:id, returns 204
  - `listClientTasks` — GET /clients/:id/tasks
  - No business logic in controller — all delegated to service
  - References: REQ-1 through REQ-6

- [x] 6. Create `apps/api/src/modules/tasks/tasks.routes.ts`
  - Apply `authenticate` and `tenantContext` middleware to all routes
  - Mount all 6 endpoints matching spec exactly
  - References: design.md API Endpoints table

- [x] 7. Register tasks router in `apps/api/src/app.ts`
  - Import `tasksRouter` from `./modules/tasks/tasks.routes`
  - Mount at `/api/v1` (same pattern as CRM and documents)
  - No other changes to `app.ts`

- [x] 8. Create `apps/api/src/modules/tasks/__tests__/README.md`
  - Placeholder noting unit tests are deferred
  - Same pattern as other modules

## Frontend Tasks

- [x] 9. Create `apps/web/src/features/tasks/types.ts`
  - `Task` interface matching API response shape
  - `CreateTaskInput`, `UpdateTaskInput`, `TasksListParams`, `TasksListResponse`
  - Status and priority union types matching enums

- [x] 10. Create `apps/web/src/features/tasks/api/tasks-api.ts`
  - `tasksApi.list(params?)` — GET /tasks
  - `tasksApi.get(id)` — GET /tasks/:id
  - `tasksApi.create(data)` — POST /tasks
  - `tasksApi.update(id, data)` — PATCH /tasks/:id
  - `tasksApi.delete(id)` — DELETE /tasks/:id
  - `tasksApi.listByClient(clientId)` — GET /clients/:id/tasks
  - Import `api` from `../../../lib/api`

- [x] 11. Create `apps/web/src/features/tasks/hooks/useTasks.ts`
  - `useTasks(params?)` — `useQuery` with key `['tasks', params]`

- [x] 12. Create `apps/web/src/features/tasks/hooks/useCreateTask.ts`
  - `useCreateTask()` — `useMutation`, invalidates `['tasks']` on success

- [x] 13. Create `apps/web/src/features/tasks/hooks/useUpdateTask.ts`
  - `useUpdateTask()` — `useMutation`, invalidates `['tasks']` and `['tasks', id]` on success

- [x] 14. Create `apps/web/src/features/tasks/components/TaskStatusBadge.tsx`
  - Renders a colored badge for each status value
  - `new` → gray, `in_progress` → blue, `waiting_client` → yellow, `review` → purple, `completed` → green
  - Uses Tailwind classes consistent with existing Badge patterns in the project

- [x] 15. Create `apps/web/src/features/tasks/components/TaskCard.tsx`
  - Compact task display: title, status badge, priority, due date, client name
  - Uses existing `Button` component for actions

- [x] 16. Create `apps/web/src/features/tasks/components/TaskForm.tsx`
  - Controlled form for create and edit
  - Fields: title (required), description, status (select), priority (select), due_date (date), client_id (optional text/select)
  - Uses `InputField` and `Label` from `components/form/`
  - Uses `Button` from `components/ui/`
  - Calls `onSubmit(data)` prop — no direct API calls inside component

- [x] 17. Create `apps/web/src/features/tasks/components/TaskList.tsx`
  - Renders tasks in a `Table` using existing `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` components
  - Columns: Title, Status, Priority, Due Date, Client, Actions (Edit, Delete)
  - Includes filter controls: status dropdown, client_id input
  - Empty state message when no tasks

- [x] 18. Create `apps/web/src/pages/tasks/index.tsx`
  - Route: `/tasks`
  - Uses `useTasks` hook with filter state
  - Renders `TaskList` component
  - "New Task" button linking to `/tasks/new`
  - Wrapped in `DashboardLayout` (via route nesting in App.tsx)

- [x] 19. Create `apps/web/src/pages/tasks/new.tsx`
  - Route: `/tasks/new`
  - Renders `TaskForm` with `useCreateTask` hook
  - On success, navigate to `/tasks`

- [x] 20. Create `apps/web/src/pages/tasks/[id].tsx`
  - Route: `/tasks/:id`
  - Fetches task by ID using `useQuery(['tasks', id])`
  - Renders task detail with `TaskStatusBadge`
  - Edit button opens `TaskForm` pre-filled with existing data using `useUpdateTask`
  - Delete button calls soft delete, navigates back to `/tasks`

- [x] 21. Register task routes in `apps/web/src/App.tsx`
  - Add imports for `TasksPage`, `NewTaskPage`, `TaskDetailPage`
  - Add three `<Route>` entries inside the `DashboardLayout` route group
  - No other changes to `App.tsx`

## Verification Tasks

- [x] 22. Curl test — create task
  - POST /api/v1/tasks with valid JWT
  - Verify 201 response with correct fields

- [x] 23. Curl test — list tasks with filters
  - GET /api/v1/tasks?status=new
  - GET /api/v1/tasks?client_id=:id
  - Verify firm_id isolation (different firm token returns empty)

- [x] 24. Curl test — update task status to completed
  - PATCH /api/v1/tasks/:id with `{"status":"completed"}`
  - Verify `completed_at` is set in response

- [x] 25. Curl test — soft delete
  - DELETE /api/v1/tasks/:id → 204
  - GET /api/v1/tasks/:id → 404

- [x] 26. Curl test — client tasks
  - GET /api/v1/clients/:id/tasks
  - Verify only tasks for that client returned
