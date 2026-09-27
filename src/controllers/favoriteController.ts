import type { NextFunction, Request, Response } from 'express';
import { addFavorite, listFavorites, removeFavorite } from '../services/favoriteService';
import { AppError } from '../middleware/errorHandler';

function readRecipeId(req: Request): number {
  const idParameter = req.params.recipeId;

  if (Array.isArray(idParameter) || !/^\d+$/.test(idParameter) || Number(idParameter) < 1) {
    throw new AppError('Recipe id must be a positive whole number', 400);
  }

  return Number(idParameter);
}

/**
 * Adds a recipe to the authenticated user's favourites.
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
 */
export function remove(req: Request, res: Response, next: NextFunction): void {
  try {
    removeFavorite(req.user!.id, readRecipeId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
