import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { tenantContext } from '../../shared/middleware/tenant-context';
import { validate } from '../../shared/middleware/validation';
import { CreateTaskSchema, UpdateTaskSchema } from './tasks.validation';

const router = Router();

// Tasks
router.get('/tasks', authenticate, tenantContext, tasksController.listTasks);
router.post('/tasks', authenticate, tenantContext, validate(CreateTaskSchema), tasksController.createTask);
router.get('/tasks/:id', authenticate, tenantContext, tasksController.getTask);
router.patch('/tasks/:id', authenticate, tenantContext, validate(UpdateTaskSchema), tasksController.updateTask);
router.delete('/tasks/:id', authenticate, tenantContext, tasksController.deleteTask);

// Client tasks
router.get('/clients/:id/tasks', authenticate, tenantContext, tasksController.listClientTasks);

export default router;
