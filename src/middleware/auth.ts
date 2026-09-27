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
 * Verifies a Bearer token and returns the identity it carries.
 *
 * @param authorization - Raw value of the `Authorization` request header.
 * @returns The authenticated user, or `null` when the header is absent.
 * @throws {AppError} 401 when the header is present but the token is not valid.
 */
function readBearerToken(authorization: string | undefined): AuthenticatedUser | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || id < 1 || !payload.role) {
      throw new AppError('Invalid access token', 401);
    }

    return { id, role: payload.role };
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Invalid access token', 401);
  }
}

/**
 * Requires a valid Bearer token and stores its user details on the request.
 *
 * @param req - The incoming Express request.
 * @param _res - Unused Express response.
 * @param next - Express continuation callback; receives an `AppError` on failure.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const user = readBearerToken(req.header('Authorization'));

    if (!user) {
      next(new AppError('Authentication is required', 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Populates `req.user` when a valid Bearer token is supplied, but never rejects.
 *
 * This is used on otherwise public endpoints so the hypermedia links in the
 * response can reflect what the current caller is actually allowed to do,
 * without making the resource private.
 *
 * @param req - The incoming Express request.
 * @param _res - Unused Express response.
 * @param next - Express continuation callback; always called without an error.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const user = readBearerToken(req.header('Authorization'));

    if (user) {
      req.user = user;
    }
  } catch {
    // A malformed or expired token is simply treated as an anonymous caller.
  }

  next();
}

/**
 * Allows access only to authenticated users with an administrator role.
 *
 * @param req - The incoming Express request; must already have passed `requireAuth`.
 * @param _res - Unused Express response.
 * @param next - Express continuation callback; receives a 403 `AppError` when denied.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    next(new AppError('Administrator access is required', 403));
    return;
  }

  next();
}
