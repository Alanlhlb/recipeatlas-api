import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { getRecipeById } from './recipeService';

interface CreateMessageInput {
  recipeId?: unknown;
  subject?: unknown;
  body?: unknown;
}

export interface ContactMessage {
  id: number;
  userId: number;
  recipeId: number;
  subject: string;
  body: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  recipeTitle?: string;
}

/**
 * Stores a message from an authenticated user about a local recipe.
 */
export function createMessage(userId: number, input: CreateMessageInput): ContactMessage {
  if (!Number.isInteger(input.recipeId) || (input.recipeId as number) < 1) {
    throw new AppError('recipeId must be a positive whole number', 400);
  }

  if (typeof input.subject !== 'string' || input.subject.trim().length < 3) {
    throw new AppError('subject must contain at least 3 characters', 400);
  }

  if (typeof input.body !== 'string' || input.body.trim().length < 10) {
    throw new AppError('body must contain at least 10 characters', 400);
  }

  const recipeId = input.recipeId as number;
  getRecipeById(recipeId);

  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO messages (userId, recipeId, subject, body, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(userId, recipeId, input.subject.trim(), input.body.trim(), createdAt);

  return {
    id: Number(result.lastInsertRowid),
    userId,
    recipeId,
    subject: input.subject.trim(),
    body: input.body.trim(),
    createdAt,
  };
}

/**
 * Lists all user messages for an administrator.
 */
export function listMessages(): ContactMessage[] {
  return db
    .prepare(
      `SELECT messages.id, messages.userId, messages.recipeId, messages.subject,
              messages.body, messages.createdAt, users.name AS userName,
              users.email AS userEmail, recipes.title AS recipeTitle
       FROM messages
       JOIN users ON users.id = messages.userId
       JOIN recipes ON recipes.id = messages.recipeId
       ORDER BY messages.createdAt DESC, messages.id DESC`,
    )
    .all() as ContactMessage[];
}
