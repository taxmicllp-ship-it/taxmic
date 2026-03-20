import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { ListTasksQuerySchema } from './tasks.validation';
import { ListTasksQuery } from './tasks.types';

export const tasksController = {
  async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const parsed = ListTasksQuerySchema.parse(req.query);
      const result = await tasksService.listTasks(firmId, parsed as ListTasksQuery);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const userId = req.user!.userId;
      const task = await tasksService.createTask(firmId, userId, req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  },

  async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const task = await tasksService.getTask(firmId, req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const task = await tasksService.updateTask(firmId, req.params.id, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      await tasksService.deleteTask(firmId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async listClientTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const tasks = await tasksService.listClientTasks(firmId, req.params.id);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  },
};
