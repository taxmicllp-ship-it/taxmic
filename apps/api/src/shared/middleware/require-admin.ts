import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }
  next();
}
