import { tasksRepository } from './tasks.repository';
import { AppError } from '../../shared/utils/errors';
import { logger } from '../../shared/utils/logger';
import { CreateTaskDto, UpdateTaskDto, ListTasksQuery } from './tasks.types';
import { notificationsService } from '../notifications/index';

class TasksService {
  async createTask(firmId: string, userId: string, data: CreateTaskDto) {
    const task = await tasksRepository.create(firmId, userId, data);
    logger.info({ event: 'TASK_CREATED', firmId, resourceId: task.id });

    if (data.assignee_ids?.length) {
      try {
        for (const assigneeId of data.assignee_ids) {
          await notificationsService.createNotification(firmId, {
            user_id: assigneeId,
            type: 'task_assigned',
            title: `Task Assigned: ${task.title}`,
            message: 'You have been assigned a task.',
            entity_type: 'task',
            entity_id: task.id,
          });
        }
      } catch (err) {
        logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
      }
    }

    return task;
  }

  async getTask(firmId: string, taskId: string) {
    const task = await tasksRepository.findById(firmId, taskId);
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
    return task;
  }

  async listTasks(firmId: string, query: ListTasksQuery) {
    return tasksRepository.findAll(firmId, query);
  }

  async updateTask(firmId: string, taskId: string, data: UpdateTaskDto) {
    const existing = await this.getTask(firmId, taskId);

    let completed_at: Date | null | undefined = undefined;
    if (data.status === 'completed' && existing.status !== 'completed') {
      completed_at = new Date();
    } else if (data.status && data.status !== 'completed' && existing.status === 'completed') {
      completed_at = null;
    }

    const task = await tasksRepository.update(firmId, taskId, { ...data, completed_at });
    logger.info({ event: 'TASK_UPDATED', firmId, resourceId: taskId });
    return task;
  }

  async deleteTask(firmId: string, taskId: string) {
    await this.getTask(firmId, taskId);
    await tasksRepository.softDelete(firmId, taskId);
    logger.info({ event: 'TASK_DELETED', firmId, resourceId: taskId });
  }

  async listClientTasks(firmId: string, clientId: string) {
    return tasksRepository.findByClient(firmId, clientId);
  }
}

export const tasksService = new TasksService();
