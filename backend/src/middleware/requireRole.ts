import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../common/ApiError';

/**
 * Factory middleware that checks if the authenticated user's role
 * is in the allowed list.
 *
 * Usage: router.get('/admin-only', authenticate, requireRole(['ADMIN']), controller)
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};
