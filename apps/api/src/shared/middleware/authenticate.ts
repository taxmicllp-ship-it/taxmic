import { Request, Response, NextFunction } from 'express';
import { jwtStrategy, AppError } from '../../modules/auth/jwt.strategy';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwtStrategy.verify(token);
    req.tenantId = req.user.firmId;
    next();
  } catch (err) {
    next(err);
  }
}
