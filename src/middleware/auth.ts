import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/env';
import { AppError } from './errorHandler';
import type { AuthenticatedUser } from '../types/auth';
import type { UserRole } from '../types/user';

interface TokenPayload extends jwt.JwtPayload {
  role?: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Requires a valid Bearer token and stores its user details on the request.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || id < 1 || !payload.role) {
      throw new AppError('Invalid access token', 401);
    }

    req.user = { id, role: payload.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid access token', 401));
  }
}

/**
 * Allows access only to authenticated users with an administrator role.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    next(new AppError('Administrator access is required', 403));
    return;
  }

  next();
}
