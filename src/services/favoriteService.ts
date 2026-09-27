import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { getRecipeById } from './recipeService';
import type { Recipe } from '../types/recipe';

/**
 * Adds one local recipe to a user's favourites.
 */
export function addFavorite(userId: number, recipeId: number): void {
  getRecipeById(recipeId);

  try {
    db.prepare('INSERT INTO favorites (userId, recipeId, createdAt) VALUES (?, ?, ?)').run(
      userId,
      recipeId,
      new Date().toISOString(),
    );
  } catch (error) {
    const databaseError = error as { code?: string };

    if (databaseError.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      throw new AppError('Recipe is already in your favorites', 409);
    }

    throw error;
  }
}

/**
 * Returns the current user's saved recipes.
 */
export function listFavorites(userId: number): Recipe[] {
  const rows = db
    .prepare('SELECT recipeId FROM favorites WHERE userId = ? ORDER BY createdAt DESC')
    .all(userId) as Array<{ recipeId: number }>;

  return rows.map((row) => getRecipeById(row.recipeId));
}

/**
 * Removes a saved recipe belonging to the current user.
 */
export function removeFavorite(userId: number, recipeId: number): void {
  const result = db
    .prepare('DELETE FROM favorites WHERE userId = ? AND recipeId = ?')
    .run(userId, recipeId);

  if (result.changes === 0) {
    throw new AppError('Favorite was not found', 404);
  }
}
