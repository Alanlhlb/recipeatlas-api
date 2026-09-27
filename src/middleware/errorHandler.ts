import type { NextFunction, Request, Response } from 'express';

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

/**
 * Returns a consistent response when no route matches a request.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Prevents unexpected errors from terminating the server and avoids exposing
 * internal error details to API consumers.
 */
export function errorHandler(
  error: ErrorWithStatusCode,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode =
    error.statusCode && error.statusCode >= 400 && error.statusCode <= 599
      ? error.statusCode
      : 500;

  if (statusCode === 500) {
    console.error('Unhandled application error:', error);
  }

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
}
