import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { getRecipeById } from './recipeService';

/** Raw message body; fields are unvalidated and typed `unknown` on purpose. */
interface CreateMessageInput {
  recipeId?: unknown;
  subject?: unknown;
  body?: unknown;
}

/**
 * A stored contact message, optionally joined with the sender and recipe details
 * that administrators see.
 */
export interface ContactMessage {
  /** Surrogate key of the message. */
  id: number;
  /** Identifier of the user who sent the message. */
  userId: number;
  /** Identifier of the recipe the message refers to. */
  recipeId: number;
  /** Short summary of the message. */
  subject: string;
  /** Full message text. */
  body: string;
  /** ISO-8601 timestamp of creation. */
  createdAt: string;
  /** Sender's display name, present only in administrator listings. */
  userName?: string;
  /** Sender's email address, present only in administrator listings. */
  userEmail?: string;
  /** Title of the referenced recipe, present only in administrator listings. */
  recipeTitle?: string;
}

/**
 * Stores a message from an authenticated user about a local recipe.
 *
 * @param userId - Identifier of the authenticated sender.
 * @param input - Raw message body containing the recipe id, subject and body.
 * @returns The stored message.
 * @throws {AppError} 400 when a field is invalid, 404 when the recipe does not exist.
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
 *
 * @returns Every message joined with its sender and recipe, newest first.
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
