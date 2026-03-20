import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../../modules/auth/jwt.strategy';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
