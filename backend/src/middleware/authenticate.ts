import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../common/ApiError';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        departmentId: string | null;
      };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      role: string;
      departmentId: string | null;
    };

    req.user = {
      id: decoded.id,
      role: decoded.role,
      departmentId: decoded.departmentId,
    };

    next();
  } catch {
    throw new ApiError(401, 'Access token is expired or invalid');
  }
};
