import type { NextFunction, Request, Response } from 'express';
import { addFavorite, listFavorites, removeFavorite } from '../services/favoriteService';
import { AppError } from '../middleware/errorHandler';

/**
 * Validates and converts the recipe id taken from the route parameters.
 *
 * @param req - Express request whose `recipeId` parameter is read.
 * @returns The recipe id as a positive whole number.
 * @throws {AppError} 400 when the parameter is missing or not a positive integer.
 */
function readRecipeId(req: Request): number {
  const idParameter = req.params.recipeId;

  if (Array.isArray(idParameter) || !/^\d+$/.test(idParameter) || Number(idParameter) < 1) {
    throw new AppError('Recipe id must be a positive whole number', 400);
  }

  return Number(idParameter);
}

/**
 * Adds a recipe to the authenticated user's favourites.
 *
 * Mounted at `POST /api/favorites/:recipeId` behind `requireAuth`, so `req.user`
 * always identifies the owner of the new favourite.
 *
 * @param req - Express request carrying the authenticated user and recipe id.
 * @param res - Express response; sends 201 when the favourite is stored.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the id is invalid, 404 when the recipe is missing,
 *   409 when the recipe is already a favourite.
 */
export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    addFavorite(req.user!.id, readRecipeId(req));
    res.status(201).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns the authenticated user's favourites.
 *
 * Mounted at `GET /api/favorites` behind `requireAuth`.
 *
 * @param req - Express request carrying the authenticated user.
 * @param res - Express response; sends 200 with the saved recipes, newest first.
 * @param next - Express continuation callback used to forward errors.
 */
export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const recipes = listFavorites(req.user!.id);
    res.status(200).json({ status: 'success', data: { recipes } });
  } catch (error) {
    next(error);
  }
}

/**
 * Removes a recipe from the authenticated user's favourites.
 *
 * Mounted at `DELETE /api/favorites/:recipeId` behind `requireAuth`.
 *
 * @param req - Express request carrying the authenticated user and recipe id.
 * @param res - Express response; sends a bodyless 204 on success.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the id is invalid, 404 when the favourite is not saved.
 */
export function remove(req: Request, res: Response, next: NextFunction): void {
  try {
    removeFavorite(req.user!.id, readRecipeId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
