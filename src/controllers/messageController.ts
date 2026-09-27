import type { NextFunction, Request, Response } from 'express';
import { createMessage, listMessages } from '../services/messageService';

/**
 * Creates a message from the authenticated user to the platform administrators.
 *
 * Mounted at `POST /api/messages` behind `requireAuth`, so `req.user` always
 * identifies the sender.
 *
 * @param req - Express request carrying the authenticated user and message body.
 * @param res - Express response; sends 201 with the stored message.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when a field is invalid, 404 when the referenced recipe is missing.
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
 *
 * Mounted at `GET /api/messages` behind `requireAuth` and `requireAdmin`, so only
 * an administrator can read other users' messages.
 *
 * @param req - Express request; unused because every message is returned.
 * @param res - Express response; sends 200 with the messages, newest first.
 * @param next - Express continuation callback used to forward errors.
 */
export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const messages = listMessages();
    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) {
    next(error);
  }
}
