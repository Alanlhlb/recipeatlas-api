import type { NextFunction, Request, Response } from 'express';

/** An `Error` that may carry an HTTP status code assigned by a lower layer. */
interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

/**
 * Represents an expected API error with a safe HTTP status code.
 *
 * Services and middleware throw this to signal a client-visible failure; the
 * central error handler turns it into a JSON response carrying the same status.
 */
export class AppError extends Error {
  /**
   * @param message - Human-readable description returned to the client.
   * @param statusCode - HTTP status code to send with the error response.
   */
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Returns a consistent 404 JSON response when no route matches a request.
 *
 * Registered after every router, so it only runs when nothing else handled the request.
 *
 * @param req - The unmatched Express request; its method and URL are echoed back.
 * @param res - The Express response used to send the 404 body.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Central error handler that prevents unexpected errors from terminating the
 * server and avoids exposing internal error details to API consumers.
 *
 * An error carrying a status code between 400 and 599 is surfaced with that
 * status; anything else is reported as a generic 500. When the response has
 * already started, the error is forwarded instead.
 *
 * @param error - The error thrown or forwarded by earlier middleware.
 * @param _req - Unused Express request.
 * @param res - The Express response used to send the error body.
 * @param next - Express continuation callback, used when headers were already sent.
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
