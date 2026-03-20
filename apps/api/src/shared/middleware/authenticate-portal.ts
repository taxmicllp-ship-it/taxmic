import { Request, Response, NextFunction } from 'express';
import { jwtStrategy } from '../../modules/auth/jwt.strategy';
import { AppError } from '../../shared/utils/errors';
import { PortalJwtPayload } from '../../modules/portal/portal.types';

export function authenticatePortal(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwtStrategy.verify(token) as unknown as PortalJwtPayload;
    if (payload.type !== 'portal') {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }
    req.portalUser = {
      clientUserId: payload.clientUserId,
      clientId: payload.clientId,
      firmId: payload.firmId,
      email: payload.email,
    };
    next();
  } catch (err) {
    next(err);
  }
}
