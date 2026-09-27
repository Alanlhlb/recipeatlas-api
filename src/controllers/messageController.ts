import type { NextFunction, Request, Response } from 'express';
import { createMessage, listMessages } from '../services/messageService';

/**
 * Creates a message from the authenticated user to the platform administrators.
 */
export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    const message = createMessage(req.user!.id, req.body);
    res.status(201).json({ status: 'success', data: { message } });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns user messages to an authenticated administrator.
 */
export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const messages = listMessages();
    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) {
    next(error);
  }
}
